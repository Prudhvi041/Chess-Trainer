/// <reference lib="webworker" />
import { analyzeGame } from './analyze';
import { chooseBotMove, positionFrom } from './levels';
import type { EngineRequest, EngineResponse } from './protocol';
import { Searcher } from './search';

const post = (msg: EngineResponse) => (self as unknown as DedicatedWorkerGlobalScope).postMessage(msg);

self.onmessage = (e: MessageEvent<EngineRequest>) => {
  const req = e.data;
  try {
    switch (req.type) {
      case 'bot':
        post({ id: req.id, type: 'bot', move: chooseBotMove(req.fen, req.moves, req.level).move });
        break;
      case 'search': {
        const result = new Searcher(positionFrom(req.fen, req.moves)).search({ depth: req.depth, timeMs: req.timeMs });
        post({ id: req.id, type: 'search', result });
        break;
      }
      case 'analyze': {
        const positions = analyzeGame(req.fen, req.moves, req, (done, total) =>
          post({ id: req.id, type: 'progress', done, total }),
        );
        post({ id: req.id, type: 'analyze', positions });
        break;
      }
    }
  } catch (err) {
    post({ id: req.id, type: 'error', message: err instanceof Error ? err.message : String(err) });
  }
};
