import { supabase } from '../lib/supabase';

export async function logAdminAction(
  adminEmail: string,
  actionType: string,
  targetId: string,
  targetTitle: string,
): Promise<void> {
  try {
    await supabase.from('admin_audit_logs').insert({
      admin_email: adminEmail,
      action_type: actionType,
      target_id: targetId,
      target_title: targetTitle,
    });
  } catch (err) {
    console.error('[AuditLogger] Failed to write audit log:', err);
  }
}
