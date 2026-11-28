<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Optional profile details a participant can fill in from their own
     * profile page. Both are nullable: the admin "export users" sheet
     * simply leaves these blank for anyone who hasn't filled them in.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('address', 255)->nullable()->after('bio');
            $table->string('job_title', 150)->nullable()->after('address');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['address', 'job_title']);
        });
    }
};