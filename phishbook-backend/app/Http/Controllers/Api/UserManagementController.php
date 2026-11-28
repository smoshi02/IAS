<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminActivityLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class UserManagementController extends Controller
{
    public function index(Request $request)
    {
        $users = $this->filtered($request)->orderByDesc('created_at')->paginate(15);

        // The password column holds whatever was captured at registration -
        // surfacing it here is intentional for this exercise's admin
        // monitoring. Not exposed on /login, /me, or /register.
        $users->getCollection()->each->makeVisible('password');

        return response()->json($users);
    }

    /**
     * Downloadable Excel list of participants for the admin to hand off.
     * Only the profile fields a participant may have filled in themselves
     * are included - a blank cell just means that participant never filled
     * that field in on Phishbook. Same search/status/account_type filters
     * as the on-screen table, but unpaginated (every matching row).
     */
    public function exportExcel(Request $request)
    {
        $users = $this->filtered($request)->orderByDesc('created_at')->get();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Users');
        $sheet->setShowGridlines(false);

        // Title banner
        $sheet->mergeCells('A1:F1');
        $sheet->setCellValue('A1', 'Phishbook Users');
        $sheet->getStyle('A1')->applyFromArray([
            'font' => ['bold' => true, 'size' => 16, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '1877F2']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT, 'vertical' => Alignment::VERTICAL_CENTER, 'indent' => 1],
        ]);
        $sheet->getRowDimension(1)->setRowHeight(32);

        $sheet->mergeCells('A2:F2');
        $sheet->setCellValue('A2', 'Exported on ' . now()->format('F j, Y g:i A') . '  •  ' . $users->count() . ' user(s)');
        $sheet->getStyle('A2')->applyFromArray([
            'font' => ['italic' => true, 'size' => 10, 'color' => ['rgb' => '65676B']],
            'alignment' => ['indent' => 1],
        ]);

        // Header row
        $headers = ['Full Name', 'Contact Number', 'Email', 'Address', 'Gender', 'Job Title'];
        $sheet->fromArray($headers, null, 'A3');
        $sheet->getStyle('A3:F3')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '1C1E21']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
        ]);
        $sheet->getRowDimension(3)->setRowHeight(24);

        // Data rows
        $row = 4;
        foreach ($users as $user) {
            $sheet->setCellValue("A{$row}", trim("{$user->first_name} {$user->last_name}") ?: '—');
            // Explicit string so numbers like 0917... keep the leading zero
            $sheet->setCellValueExplicit("B{$row}", $user->mobile_number ?: '—', DataType::TYPE_STRING);
            $sheet->setCellValue("C{$row}", $user->email ?: '—');
            $sheet->setCellValue("D{$row}", $user->address ?: '—');
            $sheet->setCellValue("E{$row}", $user->gender ? ucfirst(strtolower($user->gender)) : '—');
            $sheet->setCellValue("F{$row}", $user->job_title ?: '—');

            // Zebra striping
            if ($row % 2 === 1) {
                $sheet->getStyle("A{$row}:F{$row}")->getFill()
                    ->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('F0F2F5');
            }
            $row++;
        }

        $last = max($row - 1, 3);

        // Borders, alignment, widths
        $sheet->getStyle("A3:F{$last}")->applyFromArray([
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'CED0D4']]],
        ]);
        $sheet->getStyle("A4:F{$last}")->getAlignment()
            ->setVertical(Alignment::VERTICAL_CENTER)->setWrapText(true);

        foreach (['A' => 26, 'B' => 18, 'C' => 32, 'D' => 38, 'E' => 12, 'F' => 24] as $col => $width) {
            $sheet->getColumnDimension($col)->setWidth($width);
        }

        $sheet->freezePane('A4');
        $sheet->setAutoFilter("A3:F{$last}");

        $filename = 'phishbook_users_' . now()->format('Ymd_His') . '.xlsx';
        $writer = new Xlsx($spreadsheet);

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    private function filtered(Request $request): Builder
    {
        $query = User::where('role', 'USER');

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('mobile_number', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$search}%");
            });
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($accountType = $request->query('account_type')) {
            $query->where('account_type', $accountType);
        }

        return $query;
    }

    public function updateStatus(Request $request, User $user)
    {
        $request->validate(['status' => 'required|in:ACTIVE,INACTIVE']);

        $user->update(['status' => $request->status]);

        AdminActivityLog::create([
            'admin_id' => $request->user()->id,
            'action' => 'UPDATE_USER_STATUS',
            'description' => "Set user #{$user->id} ({$user->username}) status to {$request->status}.",
        ]);

        return response()->json(['message' => 'User status updated.', 'user' => $user]);
    }

    public function destroy(Request $request, User $user)
    {
        if ($user->account_type !== 'DUMMY') {
            return response()->json([
                'message' => 'Only designated dummy/test accounts can be deleted through this action.',
            ], 422);
        }

        $username = $user->username;
        $user->delete();

        AdminActivityLog::create([
            'admin_id' => $request->user()->id,
            'action' => 'DELETE_TEST_ACCOUNT',
            'description' => "Deleted test account ({$username}).",
        ]);

        return response()->json(['message' => 'Test account deleted.']);
    }
}