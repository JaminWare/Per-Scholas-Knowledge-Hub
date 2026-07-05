import { supabase } from '../lib/supabase';

export async function logAdminAction(
  adminEmail: string,
  actionType: string,
  targetId: string | undefined,
  targetTitle: string,
): Promise<void> {
  try {
    await supabase.from('admin_audit_logs').insert({
      admin_email: adminEmail,
      action_taken: actionType,
      target_id: targetId ?? null,
      target_title: targetTitle,
    });
  } catch (err) {
    console.error('[AuditLogger] Failed to write audit log:', err);
  }
}
