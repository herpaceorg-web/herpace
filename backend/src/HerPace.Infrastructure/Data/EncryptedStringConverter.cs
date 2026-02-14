using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Microsoft.Extensions.Logging;

namespace HerPace.Infrastructure.Data;

/// <summary>
/// EF Core value converter that encrypts/decrypts string values using AES-256.
/// Used for sensitive fields like OAuth access tokens and refresh tokens.
/// The encryption key is read from configuration (Encryption:TokenEncryptionKey).
/// </summary>
public class EncryptedStringConverter : ValueConverter<string?, string?>
{
    public EncryptedStringConverter(byte[] encryptionKey)
        : base(
            v => Encrypt(v, encryptionKey),
            v => Decrypt(v, encryptionKey))
    {
    }

    private static string? Encrypt(string? plainText, byte[] key)
    {
        if (string.IsNullOrEmpty(plainText))
            return plainText;

        using var aes = Aes.Create();
        aes.Key = DeriveKey(key);
        aes.GenerateIV();

        using var encryptor = aes.CreateEncryptor();
        var plainBytes = Encoding.UTF8.GetBytes(plainText);
        var cipherBytes = encryptor.TransformFinalBlock(plainBytes, 0, plainBytes.Length);

        // Prepend IV to ciphertext for storage
        var result = new byte[aes.IV.Length + cipherBytes.Length];
        Buffer.BlockCopy(aes.IV, 0, result, 0, aes.IV.Length);
        Buffer.BlockCopy(cipherBytes, 0, result, aes.IV.Length, cipherBytes.Length);

        return Convert.ToBase64String(result);
    }

    private static string? Decrypt(string? cipherText, byte[] key)
    {
        if (string.IsNullOrEmpty(cipherText))
            return cipherText;

        try
        {
            var fullCipher = Convert.FromBase64String(cipherText);

            using var aes = Aes.Create();
            aes.Key = DeriveKey(key);

            // Extract IV from first 16 bytes
            var iv = new byte[aes.BlockSize / 8];
            var cipher = new byte[fullCipher.Length - iv.Length];
            Buffer.BlockCopy(fullCipher, 0, iv, 0, iv.Length);
            Buffer.BlockCopy(fullCipher, iv.Length, cipher, 0, cipher.Length);
            aes.IV = iv;

            using var decryptor = aes.CreateDecryptor();
            var plainBytes = decryptor.TransformFinalBlock(cipher, 0, cipher.Length);

            return Encoding.UTF8.GetString(plainBytes);
        }
        catch (FormatException)
        {
            // Data is not base64 — likely stored before encryption was enabled.
            // Return as-is to allow reading legacy unencrypted values.
            return cipherText;
        }
        catch (CryptographicException)
        {
            // Data was not encrypted or key mismatch — return as-is for backward compatibility.
            return cipherText;
        }
    }

    /// <summary>
    /// Derives a 256-bit key from the provided key material using SHA-256.
    /// This ensures any length input produces a valid AES-256 key.
    /// </summary>
    private static byte[] DeriveKey(byte[] keyMaterial)
    {
        return SHA256.HashData(keyMaterial);
    }
}
