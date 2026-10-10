import { describe, expect, it } from 'vitest';
import { ticketToken, adminHead } from '@/lib/admin-utils';
describe('Gate ticket parsing', () => {
 const token = 'a'.repeat(48);
 it('accepts opaque QR tokens and secure ticket links', () => { expect(ticketToken(token)).toBe(token); expect(ticketToken(`https://no-fuss-tickets.lovable.app/tickets/${token}`)).toBe(token); });
 it('rejects malformed codes and unrelated URLs', () => { expect(ticketToken('TK-12345')).toBeNull(); expect(ticketToken(`https://example.com/pay/${token}`)).toBeNull(); expect(ticketToken('a'.repeat(47))).toBeNull(); });
});
describe('Organiser metadata', () => { it('provides branded titles and social metadata', () => { const head=adminHead('Events','Manage events'); expect(head.meta.some(m=>'property' in m&&m.property==='og:description')).toBe(true); expect(head.meta[0]).toEqual({title:'Events — Tumdo Kalenjin Connect'}); }); });
