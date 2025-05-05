# Hướng dẫn di chuyển từ chuỗi tĩnh sang i18n

## Giới thiệu

Tài liệu này cung cấp hướng dẫn để di chuyển mã nguồn của bạn từ việc sử dụng chuỗi tĩnh (hardcoded string) sang sử dụng i18n để hỗ trợ đa ngôn ngữ.

## Cấu trúc thư mục

Dự án sử dụng thư viện i18next và react-i18next với cấu trúc thư mục như sau:

```
/public/locales
├── en/
│   └── translation.json
├── vi/
│   └── translation.json
```

## Hướng dẫn di chuyển

### Bước 1: Import hook useTranslation

```tsx
import { useTranslation } from 'react-i18next';
```

### Bước 2: Sử dụng hook trong component

```tsx
const { t } = useTranslation();
```

### Bước 3: Thay thế chuỗi tĩnh bằng t function

Thay:

```tsx
<h1>Tên máy chủ</h1>
```

Bằng:

```tsx
<h1>{t('server.settings.rename.server_name')}</h1>
```

### Bước 4: Thêm khóa dịch vào file translation.json

Thêm vào `/public/locales/en/translation.json`:

```json
{
    "server": {
        "settings": {
            "rename": {
                "server_name": "Server Name"
            }
        }
    }
}
```

Thêm vào `/public/locales/vi/translation.json`:

```json
{
    "server": {
        "settings": {
            "rename": {
                "server_name": "Tên máy chủ"
            }
        }
    }
}
```

### Bước 5: Sử dụng variables trong chuỗi dịch

```tsx
// Trong component
<p>{t('welcome.message', { username: user.name })}</p>

// Trong file translation.json
{
  "welcome": {
    "message": "Xin chào, {{username}}!"
  }
}
```

### Bước 6: Sử dụng Trans component cho HTML phức tạp

```tsx
import { Trans, useTranslation } from 'react-i18next';

const { t } = useTranslation();

<Trans i18nKey="description.part">
  Để biết thêm thông tin, <a href="https://example.com">nhấp vào đây</a>.
</Trans>

// Trong file translation.json
{
  "description": {
    "part": "Để biết thêm thông tin, <1>nhấp vào đây</1>."
  }
}
```

## Danh sách component đã di chuyển

Các component sau đã được di chuyển để sử dụng i18n:

1. `ShellContainer.tsx`
2. `ReinstallServerBox.tsx`
3. `SettingsContainer.tsx`
4. `RenameServerBox.tsx`
5. `ScheduleContainer.tsx`
6. `AccountApiContainer.tsx`
7. `UsersContainer.tsx`
8. `ActivityLogContainer.tsx`
9. `AccountOverviewContainer.tsx`
10. `ConfigureTwoFactorForm.tsx`
11. `ApiKeyModal.tsx`
12. `RecoveryTokensDialog.tsx`
13. `CreateSSHKeyForm.tsx`
14. `ConfirmationModal.tsx`
15. `SetupTOTPDialog.tsx`
16. `UpdateEmailAddressForm.tsx`
17. `UpdateLanguageForm.tsx`
18. `ConfirmationDialog.tsx`
19. `UpdatePasswordForm.tsx`
20. `Modal.tsx`
21. `PageContentBlock.tsx`
22. `PermissionRoute.tsx`
23. `ScreenBlock.tsx` (NotFound component)

## Danh sách component cần di chuyển

Các component sau cần được di chuyển để sử dụng i18n:

1. `ScreenBlock.tsx` (phần ScreenBlock & ServerError component)
2. `MessageBox.tsx`
3. `FlashMessageRender.tsx`
4. `App.tsx` (phần Suspense "Loading...")

## Ví dụ di chuyển

### Ví dụ 1: Component MessageBox

**Trước khi di chuyển:**

```tsx
const MessageBox = ({ title, children, type }: Props) => (
    <Container
        className='flex flex-col gap-2 bg-black border-[2px] border-brand/70 p-4 rounded-2xl mb-4'
        $type={type}
        role={'alert'}
    >
        {title && <h2 className='font-bold text-xl'>{title}</h2>}
        <Code>{children}</Code>
    </Container>
);
```

**Sau khi di chuyển:**

```tsx
import { useTranslation } from 'react-i18next';

const MessageBox = ({ title, children, type }: Props) => {
    const { t } = useTranslation();

    return (
        <Container
            className='flex flex-col gap-2 bg-black border-[2px] border-brand/70 p-4 rounded-2xl mb-4'
            $type={type}
            role={'alert'}
        >
            {title && <h2 className='font-bold text-xl'>{t(title)}</h2>}
            <Code>{t(children)}</Code>
        </Container>
    );
};
```

### Ví dụ 2: Component ScreenBlock

**Trước khi di chuyển:**

```tsx
const ScreenBlock = ({ title, message }) => {
    return (
        <>
            <div className='w-full h-full flex gap-12 items-center p-8 max-w-3xl mx-auto'>
                <div className='flex flex-col gap-8 max-w-sm text-left'>
                    <h1 className='text-[32px] font-extrabold leading-[98%] tracking-[-0.11rem]'>{title}</h1>
                    <p className=''>{message}</p>
                </div>
            </div>
        </>
    );
};
```

**Sau khi di chuyển:**

```tsx
import { useTranslation } from 'react-i18next';

const ScreenBlock = ({ title, message }) => {
    const { t } = useTranslation();

    return (
        <>
            <div className='w-full h-full flex gap-12 items-center p-8 max-w-3xl mx-auto'>
                <div className='flex flex-col gap-8 max-w-sm text-left'>
                    <h1 className='text-[32px] font-extrabold leading-[98%] tracking-[-0.11rem]'>{t(title)}</h1>
                    <p className=''>{t(message)}</p>
                </div>
            </div>
        </>
    );
};
```

## Lưu ý quan trọng

1. **Cấu trúc khóa**: Sử dụng cấu trúc phân cấp cho khóa dịch, ví dụ: `component.action.message`
2. **Thống nhất cách sử dụng**: Đảm bảo sử dụng nhất quán `t` function trong toàn bộ ứng dụng
3. **Kiểm tra hỗ trợ đa ngôn ngữ**: Sau khi di chuyển, kiểm tra ứng dụng hoạt động chính xác trên tất cả ngôn ngữ được hỗ trợ
4. **Tham chiếu**: Xem code các component đã di chuyển để tham khảo cách thực hiện
