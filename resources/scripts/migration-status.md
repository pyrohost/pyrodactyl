# Trạng thái di chuyển i18n

Tài liệu này theo dõi trạng thái di chuyển các component từ chuỗi tĩnh sang sử dụng i18n.

## Components đã di chuyển

| Component                     | Trạng thái    | Ghi chú       |
| ----------------------------- | ------------- | ------------- |
| ShellContainer.tsx            | ✅ Hoàn thành |               |
| ReinstallServerBox.tsx        | ✅ Hoàn thành |               |
| SettingsContainer.tsx         | ✅ Hoàn thành |               |
| RenameServerBox.tsx           | ✅ Hoàn thành |               |
| ScheduleContainer.tsx         | ✅ Hoàn thành |               |
| AccountApiContainer.tsx       | ✅ Hoàn thành |               |
| UsersContainer.tsx            | ✅ Hoàn thành |               |
| ActivityLogContainer.tsx      | ✅ Hoàn thành |               |
| AccountOverviewContainer.tsx  | ✅ Hoàn thành |               |
| ConfigureTwoFactorForm.tsx    | ✅ Hoàn thành |               |
| ApiKeyModal.tsx               | ✅ Hoàn thành |               |
| RecoveryTokensDialog.tsx      | ✅ Hoàn thành |               |
| CreateSSHKeyForm.tsx          | ✅ Hoàn thành |               |
| ConfirmationModal.tsx         | ✅ Hoàn thành |               |
| SetupTOTPDialog.tsx           | ✅ Hoàn thành |               |
| UpdateEmailAddressForm.tsx    | ✅ Hoàn thành |               |
| UpdateLanguageForm.tsx        | ✅ Hoàn thành |               |
| ConfirmationDialog.tsx        | ✅ Hoàn thành |               |
| UpdatePasswordForm.tsx        | ✅ Hoàn thành |               |
| Modal.tsx                     | ✅ Hoàn thành |               |
| PageContentBlock.tsx          | ✅ Hoàn thành |               |
| PermissionRoute.tsx           | ✅ Hoàn thành |               |
| ScreenBlock.tsx (NotFound)    | ✅ Hoàn thành |               |
| ScreenBlock.tsx (ScreenBlock) | ✅ Hoàn thành | Mới di chuyển |
| ScreenBlock.tsx (ServerError) | ✅ Hoàn thành | Mới di chuyển |
| MessageBox.tsx                | ✅ Hoàn thành | Mới di chuyển |
| FlashMessageRender.tsx        | ✅ Hoàn thành | Mới di chuyển |
| App.tsx (Loading)             | ✅ Hoàn thành | Mới di chuyển |

## Components cần di chuyển

| Component              | Trạng thái       | Ghi chú                        |
| ---------------------- | ---------------- | ------------------------------ |
| AuthenticatedRoute.tsx | ⏳ Chờ di chuyển |                                |
| ErrorBoundary.tsx      | ⏳ Chờ di chuyển |                                |
| Spinner.tsx            | ⏳ Chờ di chuyển | Đã cập nhật để hỗ trợ fallback |
| PyrodactylProvider.tsx | ⏳ Chờ di chuyển |                                |

## Files JSON đa ngôn ngữ

Cập nhật các khóa dịch trong files:

-   `/public/locales/en/translation.json`: Đã cập nhật ✅
-   `/public/locales/vi/translation.json`: Đã cập nhật ✅

## Tiến độ chung

-   Tổng số components: 32
-   Số components đã di chuyển: 28 (87.5%)
-   Số components chờ di chuyển: 4 (12.5%)

## Hướng dẫn di chuyển

Xem chi tiết cách thực hiện di chuyển trong file [migration-guide.md](./migration-guide.md).
