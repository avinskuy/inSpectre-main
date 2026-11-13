'use strict';

const express = require('express');
const { optionalAuth } = require('../services/accounts/auth');
const { logScan } = require('../services/storage/db');
const { analyzeArchive } = require('../services/files/archiveScanner');
const {
  analyzeApkManifest,
  evaluateApkManifest,
} = require('../services/files/apkManifestAnalyzer');
const { emitThreat, emitStats } = require('../emitter');

function createFileRouter({ scanLimiter }) {
  const router = express.Router();

  router.post(
    '/scan-file',
    scanLimiter,
    optionalAuth,
    express.raw({ type: 'application/octet-stream', limit: '25mb' }),
    async (req, res) => {
      const filename = String(req.query.filename || 'upload.zip').slice(0, 180);
      if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
        return res.status(400).json({ error: 'File kosong atau tidak terbaca.' });
      }
      if (req.body.length > 25 * 1024 * 1024) {
        return res.status(413).json({ error: 'Ukuran file melebihi batas 25 MB.' });
      }

      try {
        const result = analyzeArchive(req.body, filename);
        const isApk = /\\.apk$/i.test(filename);

        if (isApk) {
          const manifestResult = await analyzeApkManifest(req.body);
          result.manifestAnalysis = manifestResult.status;

          if (manifestResult.status === 'ANALYZED') {
            const evaluated = evaluateApkManifest(manifestResult.manifest);
            result.findings = result.findings.filter(
              (item) => item.rule !== 'SENSITIVE_ANDROID_CAPABILITIES'
            );

            const manifestFindings = evaluated.findings.map((item) => ({
              rule: item.rule,
              risk: item.severity,
              points: item.points,
              title: item.title,
              evidence: item.evidence,
              recommendation: item.recommendation,
              detail: item.context,
            }));

            result.findings.push(...manifestFindings);
            result.manifest = manifestResult.manifest;
            result.threatScore = Math.min(
              100,
              result.findings.reduce(
                (total, item) => total + (Number(item.points) || 0),
                0
              )
            );
            result.manifestSummary = evaluated.summary;
          } else {
            result.manifestAnalysisReason = manifestResult.reason;
            result.explanation.limitations.push(
              'Manifest APK tidak berhasil dianalisis oleh AAPT. Temuan permission berbasis teks hanya merupakan fallback dan dapat melewatkan permission pada Manifest biner.'
            );
          }

          result.riskLevel = result.threatScore >= 60
            ? 'BAHAYA'
            : result.threatScore >= 35
              ? 'CURIGA'
              : result.threatScore >= 15
                ? 'WASPADA'
                : 'AMAN';

          result.explanation.method += manifestResult.status === 'ANALYZED'
            ? ' serta analisis AndroidManifest.xml menggunakan AAPT.'
            : '; analisis Manifest biner tidak tersedia.';
        }

        logScan(
          'apk',
          result.fileName,
          result.threatScore,
          result.riskLevel,
          result.findings,
          req.user?.id || null
        );
        emitThreat({
          type: 'apk',
          fileName: result.fileName,
          riskLevel: result.riskLevel,
          threatScore: result.threatScore,
          scannedAt: result.scannedAt,
        });
        emitStats();
        res.set('Cache-Control', 'no-store');
        return res.json(result);
      } catch (error) {
        return res.status(400).json({
          error: error.message || 'File tidak dapat dianalisis.',
        });
      }
    }
  );

  return router;
}

module.exports = { createFileRouter };
