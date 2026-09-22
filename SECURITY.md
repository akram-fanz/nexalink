# Security Policy

## Important Disclaimers

### Legal Status

- **Not an Official SDK:** @vibersmoon/nexalink is **not** affiliated with WhatsApp or Meta Platforms.
- **Terms of Service:** Using this library to automate WhatsApp Web may violate WhatsApp's Terms of Service. Users assume all legal risks.
- **No Warranty:** This library is provided "as-is" without warranty of any kind. The maintainers are not responsible for account bans, data loss, or legal consequences.

### Protocol Reliability

- **Reverse Engineering:** WhatsApp's internal protocol is **not officially documented**. This library reverse-engineers behavior from WhatsApp Web.
- **Breaking Changes:** WhatsApp updates can break protocol compatibility. Expect occasional maintenance releases.
- **Detection Risk:** Automated messaging may trigger WhatsApp's abuse detection and result in account restrictions or bans.

## Security Practices

### Data Protection

- Session files are equivalent to account credentials. Treat them like passwords.
- Enable `encryption.enabled` with a strong passphrase to encrypt sessions (AES-256-CBC).
- Never log private keys, pairing codes, passphrases, or session tokens.
- Restrict filesystem permissions on `authDirectory` (mode 0o700).
- Rotate a session by calling `logout()` and pairing again if you suspect theft.

### File Safety

- All file paths are validated to prevent directory traversal attacks.
- Media file access is restricted to the configured `mediaDirectory`.
- Temporary files are cleaned up automatically after processing.

## Reporting a Vulnerability

Do not open a public GitHub issue for credential leaks, remote code execution, or protocol bypasses.

Email: `akram-fanz@protonmail.com` with:

- Affected version
- Reproduction steps (without live credentials)
- Impact assessment

We will acknowledge and work toward a fix within 48 hours.

## What We Will Never Ship

- Credential harvesting
- Unauthorized account access helpers
- Spam / bulk-send tooling
- CAPTCHA or platform-security bypasses
- Hidden persistence or telemetry

## Supported Versions

| Version | Status | Security |
| --- | --- | --- |
| 0.3.x | Current | Actively maintained |
| 0.2.x | Previous | Security patches only |
| 0.1.x | Legacy | End of life |
