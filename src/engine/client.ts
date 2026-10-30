import type { EngineRequest, EngineResponse, PositionAnalysis } from './protocol';
import type { SearchResult } from './search';

type Pending = {
  resolve: (r: EngineResponse) => void;
  reject: (e: Error) => void;
  onProgress?: (done: number, total: number) => void;
};

type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;

/**
 * Promise-based wrapper around the engine Web Worker.
 * One worker per client; `cancel()` terminates it (searches are synchronous inside the worker).
 */
export class EngineClient {
  private worker: Worker | null = null;
  private nextId = 1;
  private pending = new Map<number, Pending>();

  private ensure(): Worker {
    if (!this.worker) {
      this.worker = new Worker(new URL('./engine.worker.ts', import.meta.url), { type: 'module' });
      this.worker.onmessage = (e: MessageEvent<EngineResponse>) => {
        const msg = e.data;
        const p = this.pending.get(msg.id);
        if (!p) return;
        if (msg.type === 'progress') return p.onProgress?.(msg.done, msg.total);
        this.pending.delete(msg.id);
        if (msg.type === 'error') p.reject(new Error(msg.message));
        else p.resolve(msg);
      };
      this.worker.onerror = (e) => {
        this.pending.forEach((p) => p.reject(new Error(e.message || 'Engine error')));
        this.pending.clear();
      };
    }
    return this.worker;
  }

  private request(req: DistributiveOmit<EngineRequest, 'id'>, onProgress?: Pending['onProgress']) {
    const id = this.nextId++;
    return new Promise<EngineResponse>((resolve, reject) => {
      this.pending.set(id, { resolve, reject, onProgress });
      this.ensure().postMessage({ ...req, id } as EngineRequest);
    });
  }

  async botMove(fen: string, moves: string[], level: number): Promise<string | null> {
    const r = await this.request({ type: 'bot', fen, moves, level });
    return r.type === 'bot' ? r.move : null;
  }

  async search(fen: string, moves: string[], opts: { depth?: number; timeMs?: number }): Promise<SearchResult> {
    const r = await this.request({ type: 'search', fen, moves, ...opts });
    if (r.type !== 'search') throw new Error('Unexpected engine response');
    return r.result;
  }

  async analyze(
    fen: string,
    moves: string[],
    opts: { timeMs: number; depth: number },
    onProgress?: (done: number, total: number) => void,
  ): Promise<PositionAnalysis[]> {
    const r = await this.request({ type: 'analyze', fen, moves, ...opts }, onProgress);
    if (r.type !== 'analyze') throw new Error('Unexpected engine response');
    return r.positions;
  }

  /** Abort everything in flight. */
  cancel() {
    this.worker?.terminate();
    this.worker = null;
    this.pending.forEach((p) => p.reject(new Error('cancelled')));
    this.pending.clear();
  }
}
