<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropForeign(['schedule_id']);
            $table->dropIndex(['schedule_id', 'sequence_id']);
            $table->unique(['schedule_id', 'sequence_id'], 'tasks_schedule_sequence_unique');
            $table->foreign('schedule_id')->references('id')->on('schedules')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropForeign(['schedule_id']);
            $table->dropUnique('tasks_schedule_sequence_unique');
            $table->index(['schedule_id', 'sequence_id']);
            $table->foreign('schedule_id')->references('id')->on('schedules')->onDelete('cascade');
        });
    }
};
