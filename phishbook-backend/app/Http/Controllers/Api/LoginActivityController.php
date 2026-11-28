<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LoginActivity;
use Illuminate\Http\Request;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class LoginActivityController extends Controller
{
    public function index(Request $request)
    {
        $query = LoginActivity::with('user:id,first_name,last_name,username,email');

        if ($search = $request->query('search')) {
            $query->where('submitted_identifier', 'like', "%{$search}%");
        }

        if ($status = $request->query('status')) {
            $query->where('login_status', $status);
        }

        if ($date = $request->query('date')) {
            $query->whereDate('attempted_at', $date);
        }

        $activities = $query->orderByDesc('attempted_at')->paginate(20);

        $activities->getCollection()->transform(function (LoginActivity $activity) {
            return [
                'activity_id' => $activity->id,
                'participant_id' => $activity->user_id,
                'participant_name' => $activity->user
                    ? trim($activity->user->first_name . ' ' . $activity->user->last_name)
                    : null,
                'submitted_identifier' => $activity->submitted_identifier,
                'date' => $activity->attempted_at->toDateString(),
                'time' => $activity->attempted_at->toTimeString(),
                'login_status' => $activity->login_status,
                'password_field_completed' => $activity->password_field_completed,
                'ip_address' => $activity->ip_address,
            ];
        });

        return response()->json($activities);
    }

    public function exportExcel(Request $request)
    {
        $query = LoginActivity::with('user:id,first_name,last_name');

        if ($search = $request->query('search')) {
            $query->where('submitted_identifier', 'like', "%{$search}%");
        }
        if ($status = $request->query('status')) {
            $query->where('login_status', $status);
        }
        if ($date = $request->query('date')) {
            $query->whereDate('attempted_at', $date);
        }

        $activities = $query->orderByDesc('attempted_at')->get();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Login Activity');
        $sheet->setShowGridlines(false);

        // Title banner
        $sheet->mergeCells('A1:I1');
        $sheet->setCellValue('A1', 'Phishbook Login Activity');
        $sheet->getStyle('A1')->applyFromArray([
            'font' => ['bold' => true, 'size' => 16, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '1877F2']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT, 'vertical' => Alignment::VERTICAL_CENTER, 'indent' => 1],
        ]);
        $sheet->getRowDimension(1)->setRowHeight(32);

        $sheet->mergeCells('A2:I2');
        $sheet->setCellValue('A2', 'Exported on ' . now()->format('F j, Y g:i A') . '  •  ' . $activities->count() . ' record(s)');
        $sheet->getStyle('A2')->applyFromArray([
            'font' => ['italic' => true, 'size' => 10, 'color' => ['rgb' => '65676B']],
            'alignment' => ['indent' => 1],
        ]);

        // Header row
        $headers = [
            'Activity ID', 'Participant ID', 'Participant Name', 'Submitted Identifier',
            'Date', 'Time', 'Login Status', 'Password Field Completed', 'IP Address',
        ];
        $sheet->fromArray($headers, null, 'A3');
        $sheet->getStyle('A3:I3')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '1C1E21']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER, 'wrapText' => true],
        ]);
        $sheet->getRowDimension(3)->setRowHeight(30);

        // Status colours: [text, background]
        $statusColors = [
            'SUCCESSFUL_LOGIN' => ['1E7B34', 'DCF5E1'],
            'FAILED_LOGIN' => ['B3261E', 'FDE3E1'],
            'INVALID_ACCOUNT' => ['9A5B00', 'FFF0D6'],
            'UNREGISTERED_USER' => ['4B4F56', 'E4E6EB'],
        ];

        $row = 4;
        foreach ($activities as $activity) {
            $name = $activity->user ? trim($activity->user->first_name . ' ' . $activity->user->last_name) : '';

            $sheet->fromArray([
                $activity->id,
                $activity->user_id ?: '—',
                $name ?: 'Unregistered',
                $activity->submitted_identifier ?: '—',
                $activity->attempted_at->format('M j, Y'),
                $activity->attempted_at->format('g:i:s A'),
                ucwords(strtolower(str_replace('_', ' ', $activity->login_status))),
                $activity->password_field_completed ? 'Yes' : 'No',
                $activity->ip_address ?: '—',
            ], null, "A{$row}");

            // Zebra striping
            if ($row % 2 === 1) {
                $sheet->getStyle("A{$row}:I{$row}")->getFill()
                    ->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('F0F2F5');
            }

            // Colour-coded status cell
            if (isset($statusColors[$activity->login_status])) {
                [$text, $bg] = $statusColors[$activity->login_status];
                $sheet->getStyle("G{$row}")->applyFromArray([
                    'font' => ['bold' => true, 'color' => ['rgb' => $text]],
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => $bg]],
                ]);
            }
            $row++;
        }

        $last = max($row - 1, 3);

        // Borders, alignment, widths
        $sheet->getStyle("A3:I{$last}")->applyFromArray([
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'CED0D4']]],
        ]);
        $sheet->getStyle("A4:I{$last}")->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
        $sheet->getStyle("A4:B{$last}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle("E4:H{$last}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        foreach (['A' => 12, 'B' => 14, 'C' => 26, 'D' => 32, 'E' => 14, 'F' => 13, 'G' => 22, 'H' => 16, 'I' => 18] as $col => $width) {
            $sheet->getColumnDimension($col)->setWidth($width);
        }

        $sheet->freezePane('A4');
        $sheet->setAutoFilter("A3:I{$last}");

        $filename = 'login_activities_' . now()->format('Ymd_His') . '.xlsx';
        $writer = new Xlsx($spreadsheet);

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }
}