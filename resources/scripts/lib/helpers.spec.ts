import { hexToRgba, sha256Hash } from '@/lib/helpers';

describe('@/lib/helpers.ts', function () {
    describe('hexToRgba()', function () {
        it('should return the expected rgba', function () {
            expect(hexToRgba('#ffffff')).toBe('rgba(255, 255, 255, 1)');
            expect(hexToRgba('#00aabb')).toBe('rgba(0, 170, 187, 1)');
            expect(hexToRgba('#efefef')).toBe('rgba(239, 239, 239, 1)');
        });

        it('should ignore case', function () {
            expect(hexToRgba('#FF00A3')).toBe('rgba(255, 0, 163, 1)');
        });

        it('should allow alpha channel changes', function () {
            expect(hexToRgba('#ece5a8', 0.5)).toBe('rgba(236, 229, 168, 0.5)');
            expect(hexToRgba('#ece5a8', 0.1)).toBe('rgba(236, 229, 168, 0.1)');
            expect(hexToRgba('#000000', 0)).toBe('rgba(0, 0, 0, 0)');
        });

        it('should handle invalid strings', function () {
            expect(hexToRgba('')).toBe('');
            expect(hexToRgba('foobar')).toBe('foobar');
            expect(hexToRgba('#fff')).toBe('#fff');
            expect(hexToRgba('#')).toBe('#');
            expect(hexToRgba('#fffffy')).toBe('#fffffy');
        });
    });

    describe('sha256Hash()', function () {
        it('should return a valid SHA256 hash', async function () {
            const input = 'test@example.com';
            const hash = await sha256Hash(input);

            // SHA256 hash should be 64 characters long
            expect(hash).toHaveLength(64);
            // Should only contain hex characters
            expect(hash).toMatch(/^[a-f0-9]{64}$/);
        });

        it('should return consistent hashes for same input', async function () {
            const input = 'test@example.com';
            const hash1 = await sha256Hash(input);
            const hash2 = await sha256Hash(input);

            expect(hash1).toBe(hash2);
        });

        it('should return different hashes for different inputs', async function () {
            const hash1 = await sha256Hash('test1@example.com');
            const hash2 = await sha256Hash('test2@example.com');

            expect(hash1).not.toBe(hash2);
        });

        it('should handle empty string', async function () {
            const hash = await sha256Hash('');
            expect(hash).toHaveLength(64);
            expect(hash).toMatch(/^[a-f0-9]{64}$/);
        });
    });
});
