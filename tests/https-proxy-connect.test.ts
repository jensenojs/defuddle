import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import https from 'node:https';
import net from 'node:net';
import { once } from 'node:events';
import { fetchPage, DEFAULT_UA } from '../src/fetch';

// Test-only self-signed localhost certificate. The tests disable certificate
// verification and use it only to exercise HTTPS-over-CONNECT socket handling.
const TEST_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCR+RNiEaWYWbIo
fXpVw486BcYI1u3PaT2EKU6Xsh6AbgkBuqN6a0sAF6IeObm7jxdIbDEeR+k3tna4
cJ7tZOZq3/KQYPE/1QWSFOMtQrOpmRYHmw4eeHZX6naUXJrhGw/of+f/7r/75+5o
IaxYUfmZau+Hzzm5RVYDCvpdb3D67gx+yaWx1fqbuCavidy9NZFzW4oddT6SYoRk
iR3c4QZiEh2BawAveFOd3b8JJ1NuQ270gN49TccdEEYwVa3aIRHIfRLBxlFPJ+xK
HP+AaHZpjyc+Ps+3PU/5/15h84jsaiJ0hG7FmEl6objdqGBSZfPosathcaHq2ow5
x4j2RCpdAgMBAAECggEAEqiMwrdQvGWSsTxAu9+wWhFM2+plIWLpWxBQnHFHFtF5
0z/BD6/ROWTL8yMby46hwj8aFC3K8LUg/bhfiCaikTyo662IiMk42hBTbYCeKGqJ
91TpfBmXvusYVyRzI5zq7qQSypMA9TkTLzpGpk9sISEbFvf0/+qN8PuhPvo0rc44
VW1bA7EA8vFAyNHoHaJjjYuepHiUxrFt1G0aLVCmTRzKYQATPNs7wIUpthm3a9w4
3vXJCaz1swNlDvuPaODzNqKIu9jVVlKlL7TxkjT+GN3CnhSwW8HleTjojNd6/GqJ
pVxNe9OXpWgF/DtFvJx4/fCv922ck/tymDpvNF42nQKBgQDISJpg4KZHS5abBwx7
dSLCDX9KomidFYOG9ZhfDkt25jSQR6nE5Iviox/151hDzJ+sSqFo80/daku9mfmC
6+dXyPbk5gSkGtcpfb8lq2QE34qkcGd5XZwYrJ6pNhmVyUNaJbhwOdK1hqPQsyAZ
jYBFAb6nhD4Rj1jRI6JWQxNcUwKBgQC6lK9sZAajk4o4r5bOyqPu6Dk0kWmOSa1Q
cDnbTnuJAy6FMdtC53enSrgYLrEoVjLCG6CQ5qwfi63DpeVmas6chUMHIJ8EHKHS
GRk0d9K2m9agNR/IBOj2qh2DdUFWy9NxnNFY2LBLOHyQyaZRWK2mBvSLwqCSHJ0g
GMXG5AsIjwKBgFWF8y4lH7vYAjKm2uSpCzOT8eQb39IcCrMJkowcnYrjGFT31P23
nigkAhTOOfmRmilHIQ+gvlzM9BS9eDc4puvsa8kok5jDwVb9VC8wtaADGL/JI9ZG
a855f7K/4EL+01zeOJjriBdtq+wFYVKoArr02MXNiXeUH5gGwF5XfB/zAoGAFVc8
WWF3gO43ORScYzq6VXEqWeDn+eZjdHfhpjvr1VgP0hxJv/VJslDRjbKJgNubIqiW
TPyVY2ZOkbo/6t78ktqLOB17ErVTrPxB7cZmy4w3mEt7Px2Qp+X9SjP3LT5TCQOu
zkK6p1/mn4jxBQznj73r6rBwPUYYkrtCo+UhffECgYA8xYLyxUtCgEuj8fZ3U1L+
y4cjpD3tHpaKXyLjCFEAbfRU3tN2sQWcstiaJAEXHPj8OvBnxNd6BBpf6mMRZSjD
8Am7NxDp5+p/m1CIoxRYFHoFWSsqkzNhjEe3YA9FpahFtDuVE4nsPW4szOdcXzT6
0AISN+ltlbpxz9tVbzl3dA==
-----END PRIVATE KEY-----`;

const TEST_CERT = `-----BEGIN CERTIFICATE-----
MIIDCTCCAfGgAwIBAgIUH5MUhMpAZHLWoukoLDd0CyzD34YwDQYJKoZIhvcNAQEL
BQAwFDESMBAGA1UEAwwJbG9jYWxob3N0MB4XDTI2MDYwMTA3MDYzM1oXDTM2MDUy
OTA3MDYzM1owFDESMBAGA1UEAwwJbG9jYWxob3N0MIIBIjANBgkqhkiG9w0BAQEF
AAOCAQ8AMIIBCgKCAQEAkfkTYhGlmFmyKH16VcOPOgXGCNbtz2k9hClOl7IegG4J
AbqjemtLABeiHjm5u48XSGwxHkfpN7Z2uHCe7WTmat/ykGDxP9UFkhTjLUKzqZkW
B5sOHnh2V+p2lFya4RsP6H/n/+6/++fuaCGsWFH5mWrvh885uUVWAwr6XW9w+u4M
fsmlsdX6m7gmr4ncvTWRc1uKHXU+kmKEZIkd3OEGYhIdgWsAL3hTnd2/CSdTbkNu
9IDePU3HHRBGMFWt2iERyH0SwcZRTyfsShz/gGh2aY8nPj7Ptz1P+f9eYfOI7Goi
dIRuxZhJeqG43ahgUmXz6LGrYXGh6tqMOceI9kQqXQIDAQABo1MwUTAdBgNVHQ4E
FgQUZNeiRQtc86OFxaYByS/IZwwXyKowHwYDVR0jBBgwFoAUZNeiRQtc86OFxaYB
yS/IZwwXyKowDwYDVR0TAQH/BAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEAbwO4
+pOO1OfGKxGrWRJ80uFhizASYTuvR54zGBrv1LYlnrU+cFUQFUg2D4BWESz+nQvM
SsnMEZB1sa5KSjJQyKuRITKpOz/tPmB45JH2XR3mZ6y/nkkX8L1PdTJ5ECL5Mgbf
F9r5mMIjIIYA2K9ueTE07qF2MckfuPBzDfFahPap5HB6+fgP+zZlTPMs34CrG+vg
5BvSHUZPkgpKyoh6cF4tnEKcQBhRmjGC/IbvGQ6FvUOpPIf5HyVYMkUAncY0FXaS
4YQnqNlBhMl8zN59CHRFDGXdzOQvPwpE9j8pDjXLV1y5IR2A0CMBIdFCMc4ttgY+
eeBQDrCbfT+JF7S8sA==
-----END CERTIFICATE-----`;

let targetServer: https.Server | undefined;
let proxyServer: net.Server | undefined;
let targetPort = 0;
let proxyPort = 0;
let connectRequest = '';

async function listen(server: https.Server | net.Server): Promise<number> {
	server.listen(0, '127.0.0.1');
	await once(server, 'listening');
	const address = server.address();
	if (!address || typeof address === 'string') {
		throw new Error('Expected server to listen on a TCP port');
	}
	return address.port;
}

async function closeServer(server: https.Server | net.Server | undefined): Promise<void> {
	if (!server || !server.listening) {
		return;
	}
	await new Promise<void>((resolve, reject) => {
		server.close(error => error ? reject(error) : resolve());
	});
}

beforeEach(async () => {
	targetServer = https.createServer({ key: TEST_KEY, cert: TEST_CERT }, (_req, res) => {
		res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
		res.end('<html><head></head><body>proxied content</body></html>');
	});
	targetPort = await listen(targetServer);

	connectRequest = '';
	proxyServer = net.createServer(clientSocket => {
		let requestBuffer = Buffer.alloc(0);
		clientSocket.on('data', function onClientData(chunk) {
			requestBuffer = Buffer.concat([requestBuffer, chunk]);
			const headerEnd = requestBuffer.indexOf('\r\n\r\n');
			if (headerEnd === -1) {
				return;
			}

			clientSocket.off('data', onClientData);
			connectRequest = requestBuffer.subarray(0, headerEnd).toString('latin1');
			const upstream = net.connect(targetPort, '127.0.0.1', () => {
				clientSocket.write('HTTP/1.1 200 Connection established\r\n\r\n');
				const extra = requestBuffer.subarray(headerEnd + 4);
				if (extra.length > 0) {
					upstream.write(extra);
				}
				clientSocket.pipe(upstream);
				upstream.pipe(clientSocket);
			});
			upstream.on('error', error => clientSocket.destroy(error));
		});
	});
	proxyPort = await listen(proxyServer);

	vi.stubEnv('HTTPS_PROXY', `http://127.0.0.1:${proxyPort}`);
	vi.stubEnv('https_proxy', undefined as any);
	vi.stubEnv('HTTP_PROXY', undefined as any);
	vi.stubEnv('http_proxy', undefined as any);
	vi.stubEnv('ALL_PROXY', undefined as any);
	vi.stubEnv('all_proxy', undefined as any);
	vi.stubEnv('NO_PROXY', undefined as any);
	vi.stubEnv('no_proxy', undefined as any);
	vi.stubEnv('NODE_TLS_REJECT_UNAUTHORIZED', '0');
});

afterEach(async () => {
	vi.unstubAllEnvs();
	await closeServer(proxyServer);
	await closeServer(targetServer);
	proxyServer = undefined;
	targetServer = undefined;
});

describe('HTTPS proxy CONNECT requests', () => {
	test('fetches an HTTPS page through a CONNECT tunnel', async () => {
		const html = await fetchPage(`https://localhost:${targetPort}/article?x=1`, DEFAULT_UA);

		expect(html).toContain('proxied content');
		expect(connectRequest).toContain(`CONNECT localhost:${targetPort} HTTP/1.1`);
		expect(connectRequest).toContain(`Host: localhost:${targetPort}`);
	});

	test('sends proxy authorization during CONNECT', async () => {
		vi.stubEnv('HTTPS_PROXY', `http://user:pass@127.0.0.1:${proxyPort}`);

		await fetchPage(`https://localhost:${targetPort}/article`, DEFAULT_UA);

		expect(connectRequest).toContain(
			`Proxy-Authorization: Basic ${Buffer.from('user:pass').toString('base64')}`
		);
	});
});
