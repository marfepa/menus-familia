import { Storage } from '@/lib/storage';
import type { FamilySyncPayload, SyncStatusState, CloudStoreStatus } from '@/types';

type DataListener = (payload: FamilySyncPayload) => void;
type StatusListener = (status: SyncStatusState, details?: CloudStoreStatus) => void;

class SyncManager {
  private dataListeners: Set<DataListener> = new Set();
  private statusListeners: Set<StatusListener> = new Set();
  private currentStatus: SyncStatusState = 'synced';
  private cloudStatusDetails: CloudStoreStatus | null = null;
  private pollTimer: NodeJS.Timeout | null = null;
  private pushDebounceTimer: NodeJS.Timeout | null = null;
  private isPulling = false;
  private isPushing = false;
  private initialized = false;

  public init() {
    if (this.initialized || typeof window === 'undefined') return;
    this.initialized = true;

    // Comprobar estado del almacenamiento y sincronizar al arrancar
    this.checkCloudStatus().then(() => {
      this.pullFromCloud();
    });

    // Iniciar sondeo inteligente
    this.startPolling();

    // Eventos de foco, cambio de visibilidad y estado de red
    window.addEventListener('visibilitychange', this.handleVisibilityChange);
    window.addEventListener('focus', this.handleFocus);
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  public destroy() {
    if (typeof window === 'undefined') return;
    if (this.pollTimer) clearInterval(this.pollTimer);
    if (this.pushDebounceTimer) clearTimeout(this.pushDebounceTimer);

    window.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('focus', this.handleFocus);
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    this.initialized = false;
  }

  public subscribeData(listener: DataListener): () => void {
    this.dataListeners.add(listener);
    return () => this.dataListeners.delete(listener);
  }

  public subscribeStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.currentStatus, this.cloudStatusDetails || undefined);
    return () => this.statusListeners.delete(listener);
  }

  public getStatus(): { status: SyncStatusState; details: CloudStoreStatus | null } {
    return { status: this.currentStatus, details: this.cloudStatusDetails };
  }

  private setStatus(status: SyncStatusState, details?: CloudStoreStatus) {
    this.currentStatus = status;
    if (details) this.cloudStatusDetails = details;
    this.statusListeners.forEach((l) => l(this.currentStatus, this.cloudStatusDetails || undefined));
  }

  private handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      this.pullFromCloud();
    }
  };

  private handleFocus = () => {
    this.pullFromCloud();
  };

  private handleOnline = () => {
    this.pullFromCloud();
  };

  private handleOffline = () => {
    this.setStatus('offline');
  };

  private startPolling() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    // Sondeo cada 8 segundos si la pestaña está visible
    this.pollTimer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible' && !this.isPushing) {
        this.pullFromCloud();
      }
    }, 8000);
  }

  public async checkCloudStatus(): Promise<CloudStoreStatus | null> {
    try {
      const res = await fetch('/api/sync/status', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && json.status) {
        this.cloudStatusDetails = json.status as CloudStoreStatus;
        if (!this.cloudStatusDetails.configured && this.cloudStatusDetails.provider === 'unconfigured') {
          this.setStatus('local_only', this.cloudStatusDetails);
        }
        return this.cloudStatusDetails;
      }
    } catch (e) {
      console.warn('No se pudo verificar estado de la nube:', e);
    }
    return null;
  }

  /**
   * Obtiene los datos más recientes de la nube. Si la nube tiene cambios más nuevos, los aplica localmente.
   * Si la nube está vacía pero local tiene datos, migra los datos locales a la nube automáticamente.
   */
  public async pullFromCloud(force = false): Promise<boolean> {
    if (this.isPulling || typeof window === 'undefined') return false;
    if (!navigator.onLine) {
      this.setStatus('offline');
      return false;
    }

    this.isPulling = true;

    try {
      const res = await fetch('/api/sync', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const json = await res.json();
      const remoteData: FamilySyncPayload | null = json.data;

      const localUpdatedAt = Storage.getLastLocalUpdate();

      const hasRemoteData = Boolean(
        remoteData &&
          ((Array.isArray(remoteData.recipes) && remoteData.recipes.length > 0) ||
            (remoteData.plans && typeof remoteData.plans === 'object' && Object.keys(remoteData.plans).length > 0) ||
            (Array.isArray(remoteData.pantry) && remoteData.pantry.length > 0))
      );

      if (!remoteData || !hasRemoteData) {
        // La base de datos en la nube no tiene datos válidos: subir estado local actual
        const currentPayload = Storage.getFullPayload();
        await this.pushToCloudImmediate(currentPayload);
        this.setStatus('synced');
        this.isPulling = false;
        return true;
      }

      const remoteUpdatedAt = remoteData.updatedAt || '';
      const isRemoteNewer = !localUpdatedAt || new Date(remoteUpdatedAt) > new Date(localUpdatedAt);
      const isDifferentDevice = Boolean(remoteData.deviceId && remoteData.deviceId !== Storage.getDeviceId());

      // Aplicar solo si viene de otro dispositivo o si se ha forzado manualmente
      if (force || (isRemoteNewer && isDifferentDevice)) {
        Storage.applyFullPayload(remoteData);
        this.dataListeners.forEach((listener) => listener(remoteData));
        this.setStatus('synced');
        this.isPulling = false;
        return true;
      }


      this.setStatus('synced');
      this.isPulling = false;
      return false;
    } catch (error) {
      console.warn('Aviso de sincronización al leer de la nube:', error);
      if (this.cloudStatusDetails && !this.cloudStatusDetails.configured && this.cloudStatusDetails.provider === 'unconfigured') {
        this.setStatus('local_only');
      } else {
        this.setStatus('error');
      }
      this.isPulling = false;
      return false;
    }
  }

  /**
   * Dispara una sincronización a la nube con un debounce ligero para no saturar peticiones.
   */
  public triggerSync() {
    if (this.pushDebounceTimer) {
      clearTimeout(this.pushDebounceTimer);
    }

    this.setStatus('syncing');

    this.pushDebounceTimer = setTimeout(() => {
      const payload = Storage.getFullPayload();
      const now = new Date().toISOString();
      payload.updatedAt = now;
      Storage.setLastLocalUpdate(now);
      this.pushToCloudImmediate(payload);
    }, 300);
  }

  /**
   * Envía inmediatamente el payload completo a la nube.
   */
  public async pushToCloudImmediate(payload: FamilySyncPayload): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    if (!navigator.onLine) {
      this.setStatus('offline');
      return false;
    }

    this.isPushing = true;
    this.setStatus('syncing');

    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const json = await res.json();
      if (json.success) {
        if (json.updatedAt) {
          Storage.setLastLocalUpdate(json.updatedAt);
        }
        this.setStatus('synced');
        this.isPushing = false;
        return true;
      } else {
        throw new Error(json.error || 'Fallo al guardar');
      }
    } catch (error) {
      console.warn('Aviso al guardar en la nube:', error);
      if (this.cloudStatusDetails && !this.cloudStatusDetails.configured && this.cloudStatusDetails.provider === 'unconfigured') {
        this.setStatus('local_only');
      } else {
        this.setStatus('error');
      }
      this.isPushing = false;
      return false;
    }
  }
}

export const syncManager = new SyncManager();
