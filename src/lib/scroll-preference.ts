export type NativeScrollReason = 'reduced-motion' | 'data-saver' | 'low-battery' | null;

type BatteryStatus = EventTarget & { charging: boolean; level: number };
type ResourceNavigator = Navigator & {
  connection?: EventTarget & { saveData?: boolean };
  getBattery?: () => Promise<BatteryStatus>;
};

/** Low battery is a fallback: browsers do not expose the OS power-mode switch. */
export function observeScrollPreference(update: (reason: NativeScrollReason) => void) {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const device = navigator as ResourceNavigator;
  const connection = device.connection;
  let battery: BatteryStatus | undefined;
  let disposed = false;
  const refresh = () => {
    if (disposed) return;
    update(motion.matches ? 'reduced-motion'
      : connection?.saveData ? 'data-saver'
      : battery && !battery.charging && battery.level <= .2 ? 'low-battery'
      : null);
  };
  motion.addEventListener('change', refresh);
  connection?.addEventListener('change', refresh);
  refresh();
  if (device.getBattery) {
    // Permissions Policy or browser support may prevent battery access.
    void Promise.resolve().then(() => device.getBattery!()).then(status => {
      if (disposed) return;
      battery = status;
      battery.addEventListener('chargingchange', refresh);
      battery.addEventListener('levelchange', refresh);
      refresh();
    }).catch(() => { /* Keep the motion and data-saving preferences active. */ });
  }
  return () => {
    disposed = true;
    motion.removeEventListener('change', refresh);
    connection?.removeEventListener('change', refresh);
    battery?.removeEventListener('chargingchange', refresh);
    battery?.removeEventListener('levelchange', refresh);
  };
}
