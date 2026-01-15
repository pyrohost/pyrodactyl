<?php

use Illuminate\Support\Facades\Route;
use Pterodactyl\Http\Controllers\Api\Remote\ActivityProcessingController;
use Pterodactyl\Http\Controllers\Api\Remote\RusticConfigController;
use Pterodactyl\Http\Controllers\Api\Remote\SftpAuthenticationController;
use Pterodactyl\Http\Controllers\Api\Remote\Backups\BackupDeleteController;
use Pterodactyl\Http\Controllers\Api\Remote\Backups\BackupRemoteUploadController;
use Pterodactyl\Http\Controllers\Api\Remote\Backups\BackupSizeController;
use Pterodactyl\Http\Controllers\Api\Remote\ElytraJobCompletionController;
use Pterodactyl\Http\Controllers\Api\Remote\Servers\ServerDetailsController;
use Pterodactyl\Http\Controllers\Api\Remote\Servers\ServerInstallController;
use Pterodactyl\Http\Controllers\Api\Remote\Servers\ServerTransferController;
use Pterodactyl\Http\Controllers\Api\Remote\Backups;

// Routes for the Wings daemon.
Route::post('/sftp/auth', SftpAuthenticationController::class);

Route::get('/servers', [ServerDetailsController::class, 'list']);
Route::post('/servers/reset', [ServerDetailsController::class, 'resetState']);
Route::post('/activity', ActivityProcessingController::class);

Route::group(['prefix' => '/servers/{uuid}'], function () {
    Route::get('/', ServerDetailsController::class);
    Route::get('/install', [ServerInstallController::class, 'index']);
    Route::post('/install', [ServerInstallController::class, 'store']);

    Route::get('/rustic-config', [RusticConfigController::class, 'show']);
    Route::post('/backup-sizes', [BackupSizeController::class, 'update']);

    Route::get('/transfer/failure', [ServerTransferController::class, 'failure']);
    Route::get('/transfer/success', [ServerTransferController::class, 'success']);
    Route::post('/transfer/failure', [ServerTransferController::class, 'failure']);
    Route::post('/transfer/success', [ServerTransferController::class, 'success']);
});

Route::group(['prefix' => '/backups'], function () {
    Route::get('/{backup}', BackupRemoteUploadController::class);
    Route::delete('/{backup}', BackupDeleteController::class);
    Route::post('/{backup}', [Backups\BackupStatusController::class, 'index']); // NOTE: These are wings only paths, I need to make them use the DaemonType middleware
    Route::post('/{backup}/restore', [Backups\BackupStatusController::class, 'restore']);
});

Route::group(['prefix' => '/elytra-jobs'], function () {
    Route::put('/{jobId}', [ElytraJobCompletionController::class, 'update']);
});
