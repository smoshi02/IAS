<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The step-by-step sign-up flow collects a birthday and gender, lets a
     * person register with either a mobile number or an email address, and
     * records when the terms were accepted.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->date('birthday')->nullable()->after('last_name');
            $table->enum('gender', ['FEMALE', 'MALE', 'OTHER'])->nullable()->after('birthday');
            $table->timestamp('terms_accepted_at')->nullable()->after('status');

            // A mobile-only sign-up has no email, so email can no longer be required.
            $table->string('email')->nullable()->change();
            $table->unique('mobile_number');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['mobile_number']);
            $table->dropColumn(['birthday', 'gender', 'terms_accepted_at']);
            $table->string('email')->nullable(false)->change();
        });
    }
};