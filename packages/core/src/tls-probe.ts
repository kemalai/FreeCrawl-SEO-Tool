import { connect, type PeerCertificate } from 'node:tls';

/**
 * Result of probing the TLS certificate served by `host:port`. All string
 * fields are populated on success; the date fields are RFC 1123 strings
 * (the format Node returns from `peerCert.valid_from` /
 * `peerCert.valid_to`). On failure, `error` is set and the rest are null.
 */
export interface TlsCertInfo {
  validFrom: string | null;
  validTo: string | null;
  daysUntilExpiry: number | null;
  issuer: string | null;
  subject: string | null;
  signatureAlgorithm: string | null;
  /** Negotiated TLS protocol version, e.g. `TLSv1.3`. */
  protocol: string | null;
  /** Empty on success. Free-form error string when the connect/handshake fails. */
  error: string | null;
}

/**
 * Open a single TLS connection to the host and read the peer cert. We
 * disable certificate verification (`rejectUnauthorized: false`) because
 * the goal is to *audit* the cert — including expired or self-signed ones
 * — not to communicate securely. The returned data lets the caller
 * surface "certificate expired" / "expires in 12 days" issues which are
 * exactly the cases a verifying connect would refuse to surface at all.
 *
 * Times out at `timeoutMs`; on timeout the error string includes the
 * elapsed budget so it's clear in logs.
 */
export async function probeTlsCert(
  host: string,
  port = 443,
  timeoutMs = 10_000,
): Promise<TlsCertInfo> {
  return await new Promise<TlsCertInfo>((resolve) => {
    const empty: TlsCertInfo = {
      validFrom: null,
      validTo: null,
      daysUntilExpiry: null,
      issuer: null,
      subject: null,
      signatureAlgorithm: null,
      protocol: null,
      error: null,
    };

    let settled = false;
    const finish = (result: TlsCertInfo): void => {
      if (settled) return;
      settled = true;
      try {
        socket.destroy();
      } catch {
        /* ignore */
      }
      resolve(result);
    };

    const timer = setTimeout(() => {
      finish({ ...empty, error: `tls handshake timed out after ${timeoutMs}ms` });
    }, timeoutMs);

    const socket = connect(
      {
        host,
        port,
        servername: host,
        rejectUnauthorized: false,
        // Don't keep the process alive waiting on a connect we already
        // gave up on — `unref` makes the socket non-blocking for shutdown.
        ALPNProtocols: ['h2', 'http/1.1'],
      },
      () => {
        clearTimeout(timer);
        try {
          // `getPeerCertificate(false)` returns just the leaf cert — what
          // we need for expiry/issuer. `(true)` would walk the chain but
          // we don't surface chain info in V1.
          const peer = socket.getPeerCertificate(false) as PeerCertificate;
          if (!peer || Object.keys(peer).length === 0) {
            finish({ ...empty, error: 'peer certificate unavailable' });
            return;
          }
          const validTo = (peer as { valid_to?: string }).valid_to ?? null;
          const validFrom = (peer as { valid_from?: string }).valid_from ?? null;
          let daysUntilExpiry: number | null = null;
          if (validTo) {
            const t = Date.parse(validTo);
            if (!Number.isNaN(t)) {
              daysUntilExpiry = Math.floor((t - Date.now()) / (24 * 60 * 60 * 1000));
            }
          }
          const protocol = socket.getProtocol() ?? null;
          finish({
            validFrom,
            validTo,
            daysUntilExpiry,
            issuer: formatDistinguishedName(
              (peer as { issuer?: Record<string, string> }).issuer ?? null,
            ),
            subject: formatDistinguishedName(
              (peer as { subject?: Record<string, string> }).subject ?? null,
            ),
            // `peer.sigalg` was added in Node 16 but typings lag behind;
            // fall back to `signatureAlgorithm` style if not present.
            signatureAlgorithm:
              (peer as { sigalg?: string; signatureAlgorithm?: string }).sigalg ??
              (peer as { signatureAlgorithm?: string }).signatureAlgorithm ??
              null,
            protocol,
            error: null,
          });
        } catch (err) {
          finish({
            ...empty,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      },
    );

    socket.on('error', (err) => {
      clearTimeout(timer);
      finish({ ...empty, error: err instanceof Error ? err.message : String(err) });
    });
    socket.on('timeout', () => {
      clearTimeout(timer);
      finish({ ...empty, error: 'socket timeout' });
    });
    socket.setTimeout(timeoutMs);
  });
}

/**
 * Flatten Node's `tls.PeerCertificate` issuer/subject objects (which look
 * like `{ C: 'US', O: 'Google Trust Services', CN: 'WE1' }`) into a
 * compact string `CN=WE1, O=Google Trust Services, C=US`. The order
 * follows the most-specific-first convention used by `openssl x509`.
 */
function formatDistinguishedName(dn: Record<string, string> | null): string | null {
  if (!dn || typeof dn !== 'object') return null;
  const parts: string[] = [];
  for (const key of ['CN', 'O', 'OU', 'L', 'ST', 'C']) {
    const v = dn[key];
    if (typeof v === 'string' && v) parts.push(`${key}=${v}`);
  }
  if (parts.length === 0) return null;
  return parts.join(', ');
}
