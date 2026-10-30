import { FILES, RANKS } from '../lib/coords';
import { EMPTY_FEN, fenAfter, START_FEN } from './chess';
import type { Lesson, Unit } from './types';

/* ───────────── helpers for authoring ───────────── */

const fileSquares = (f: string) => RANKS.map((r) => `${f}${r}`);
const rankSquares = (r: number) => FILES.map((f) => `${f}${r}`);
const longDiagonal = FILES.map((f, i) => `${f}${i + 1}`);
const only = (placement: string, turn: 'w' | 'b' = 'w') => `${placement} ${turn} - - 0 1`;

/* ───────────── Unit 1 · The board ───────────── */

const meetTheBoard: Lesson = {
  id: 'meet-the-board',
  title: 'Meet the chessboard',
  summary: 'Squares, files, ranks and diagonals.',
  minutes: 3,
  steps: [
    {
      kind: 'explain',
      title: '64 squares',
      text:
        'Chess is played on a board of **64 squares**: 8 rows and 8 columns of alternating light and dark squares.\n\nAlways set the board up so each player has a **light square in the bottom-right corner**. Easy to remember: **light on the right**.',
      fen: EMPTY_FEN,
      highlights: ['h1'],
    },
    {
      kind: 'explain',
      title: 'Files and ranks',
      text:
        'The columns are called **files** and are lettered **a to h**. The rows are called **ranks** and are numbered **1 to 8**.\n\nEvery square is named by its file and then its rank. The highlighted lines cross at **e4**.',
      fen: EMPTY_FEN,
      highlights: [...fileSquares('e'), ...rankSquares(4)],
    },
    {
      kind: 'click',
      title: 'Find e4',
      text: 'Click the square **e4**.',
      fen: EMPTY_FEN,
      answers: ['e4'],
      hint: 'Find the e-file (5th column from the left), then go up to the 4th rank.',
      success: 'Yes! e4 is one of the four central squares.',
    },
    {
      kind: 'click',
      title: 'Corners',
      text: 'Click **a8**, the top-left corner from White’s side.',
      fen: EMPTY_FEN,
      answers: ['a8'],
      hint: 'File a is on the far left; rank 8 is at the top.',
      success: 'Correct. a8 is where Black’s queenside rook starts.',
    },
    {
      kind: 'click',
      title: 'Light on the right',
      text: 'Click **h1**. Notice its color.',
      fen: EMPTY_FEN,
      answers: ['h1'],
      hint: 'Bottom-right corner.',
      success: 'h1 is a light square: light on the right!',
    },
    {
      kind: 'explain',
      title: 'Diagonals',
      text:
        'A **diagonal** is a slanted line of squares of the same color, like a1 to h8. Bishops and queens travel along diagonals.\n\nTip: the **Train** tab drills coordinates until you know every square instantly.',
      fen: EMPTY_FEN,
      highlights: longDiagonal,
      arrows: [['a1', 'h8']],
    },
  ],
};

const setup: Lesson = {
  id: 'setting-up',
  title: 'Setting up the pieces',
  summary: 'Where every piece starts.',
  minutes: 4,
  steps: [
    {
      kind: 'explain',
      title: 'The armies',
      text:
        'Each side has **16 pieces**: 1 king, 1 queen, 2 rooks, 2 bishops, 2 knights and 8 pawns.\n\n**White always moves first.** Then the players take turns, one move each.',
      fen: START_FEN,
    },
    {
      kind: 'explain',
      title: 'From the corners in',
      text:
        'On the back rank, working inward from each corner: **rooks**, then **knights**, then **bishops**.\n\nThe **pawns** stand on the rank in front of them.',
      fen: START_FEN,
      highlights: ['a1', 'h1', 'b1', 'g1', 'c1', 'f1', 'a8', 'h8', 'b8', 'g8', 'c8', 'f8'],
    },
    {
      kind: 'explain',
      title: 'Queen on her color',
      text:
        'The **queen starts on her own color**: the white queen on the light square d1, the black queen on the dark square d8.\n\nThe **kings** take the last squares, e1 and e8, facing each other.',
      fen: START_FEN,
      highlights: ['d1', 'd8', 'e1', 'e8'],
    },
    {
      kind: 'click',
      title: 'Knights',
      text: 'Click **both** squares where the white knights start.',
      fen: START_FEN,
      answers: ['b1', 'g1'],
      count: 2,
      hint: 'Knights stand right next to the rooks.',
      success: 'Right: b1 and g1.',
    },
    {
      kind: 'click',
      title: 'Missing queen',
      text: 'The white queen is missing. Click the square where she starts.',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNB1KBNR w KQkq - 0 1',
      answers: ['d1'],
      hint: 'Queen on her own color: the white queen goes on the light square in the middle.',
      success: 'Exactly: d1, a light square for the white queen.',
    },
    {
      kind: 'click',
      title: 'Missing king',
      text: 'Now the black king is missing. Click his starting square.',
      fen: 'rnbq1bnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      answers: ['e8'],
      hint: 'The kings face each other on the e-file.',
      success: 'Yes: e8. The kings face each other.',
    },
  ],
};

/* ───────────── Unit 2 · How the pieces move ───────────── */

const rook: Lesson = {
  id: 'the-rook',
  title: 'The rook',
  summary: 'Straight lines, any distance.',
  minutes: 3,
  steps: [
    {
      kind: 'explain',
      title: 'Straight lines',
      text:
        'The **rook** moves in straight lines (up, down, left or right) as many squares as it likes.\n\nIt is worth about **5 points**.',
      fen: only('8/8/8/8/3R4/8/8/8'),
      arrows: [
        ['d4', 'd8'],
        ['d4', 'd1'],
        ['d4', 'a4'],
        ['d4', 'h4'],
      ],
    },
    {
      kind: 'select',
      title: 'Blocked paths',
      text:
        'Pieces can’t jump over others. A piece **captures** by landing on an enemy’s square, but can never land on its own piece.\n\nClick **every square** the rook on d4 can move to, then press **Check**.',
      fen: only('8/8/3P4/8/3R1p2/8/8/8'),
      from: 'd4',
      hint: 'Upward it stops before its own pawn on d6. To the right it can capture on f4 but can’t go past it.',
      success: 'Perfect. You found every rook move.',
    },
    {
      kind: 'stars',
      title: 'Collect the stars',
      text: 'Move the rook to collect every star.',
      fen: only('8/8/8/8/8/8/8/R7'),
      stars: ['a5', 'e5', 'e8', 'h8'],
      hint: 'A rook can travel the whole length of the board in a single move.',
      success: 'All stars collected!',
    },
  ],
};

const bishop: Lesson = {
  id: 'the-bishop',
  title: 'The bishop',
  summary: 'Diagonals, one color forever.',
  minutes: 3,
  steps: [
    {
      kind: 'explain',
      title: 'Diagonals',
      text:
        'The **bishop** moves diagonally, any number of squares.\n\nA bishop **never changes color**: this one starts on a dark square and will stay on dark squares all game. That’s why each side has one light-squared and one dark-squared bishop. Worth about **3 points**.',
      fen: only('8/8/8/8/3B4/8/8/8'),
      arrows: [
        ['d4', 'h8'],
        ['d4', 'a7'],
        ['d4', 'a1'],
        ['d4', 'g1'],
      ],
    },
    {
      kind: 'select',
      title: 'Your turn',
      text: 'Click every square the bishop on d4 can move to, then press **Check**.',
      fen: only('8/8/5p2/8/3B4/2P5/8/8'),
      from: 'd4',
      hint: 'Your own pawn on c3 blocks that diagonal completely. The black pawn on f6 can be captured.',
      success: 'Great: eight bishop moves.',
    },
    {
      kind: 'stars',
      title: 'Collect the stars',
      text: 'Collect every star with your bishop.',
      fen: only('8/8/8/8/8/8/8/2B5'),
      stars: ['a3', 'e3', 'h6', 'f8'],
      hint: 'All the stars are on dark squares, just like your bishop.',
      success: 'Nicely done!',
    },
  ],
};

const queen: Lesson = {
  id: 'the-queen',
  title: 'The queen',
  summary: 'Rook + bishop in one piece.',
  minutes: 3,
  steps: [
    {
      kind: 'explain',
      title: 'The strongest piece',
      text:
        'The **queen** moves like a rook **and** a bishop: any number of squares in a straight line or along a diagonal.\n\nShe is worth about **9 points**, so keep her safe!',
      fen: only('8/8/8/8/3Q4/8/8/8'),
      arrows: [
        ['d4', 'd8'],
        ['d4', 'h8'],
        ['d4', 'h4'],
        ['d4', 'g1'],
        ['d4', 'd1'],
        ['d4', 'a1'],
        ['d4', 'a4'],
        ['d4', 'a7'],
      ],
    },
    {
      kind: 'select',
      title: 'Your turn',
      text: 'Click every square the queen on d4 can move to, then press **Check**.',
      fen: only('8/8/1p6/8/3Q4/8/5P2/8'),
      from: 'd4',
      hint: 'Check all eight directions. She can capture on b6 but not land on her own pawn on f2.',
      success: 'Excellent: you see the whole queen.',
    },
    {
      kind: 'stars',
      title: 'Collect the stars',
      text: 'Use your queen to collect every star.',
      fen: only('8/8/8/8/8/8/8/3Q4'),
      stars: ['d5', 'a8', 'h8', 'h1', 'b3'],
      hint: 'Mix straight and diagonal moves.',
      success: 'Queen power!',
    },
  ],
};

const king: Lesson = {
  id: 'the-king',
  title: 'The king',
  summary: 'One step at a time, never into danger.',
  minutes: 3,
  steps: [
    {
      kind: 'explain',
      title: 'The most important piece',
      text:
        'The **king** moves **one square** in any direction.\n\nHe isn’t strong, but he’s **priceless**: if your king is trapped (checkmate), you lose the game.',
      fen: only('8/8/8/8/3K4/8/8/8'),
      highlights: ['c5', 'd5', 'e5', 'c4', 'e4', 'c3', 'd3', 'e3'],
    },
    {
      kind: 'select',
      title: 'Danger squares',
      text:
        'A king may **never** move onto a square attacked by an enemy piece. The black rook guards the whole 5th rank.\n\nClick every square the white king can safely move to.',
      fen: only('8/8/8/5r2/3K4/8/8/8'),
      from: 'd4',
      hint: 'The rook on f5 attacks c5, d5 and e5. Every other neighbouring square is safe.',
      success: 'Correct. The king stays out of the rook’s line.',
    },
    {
      kind: 'stars',
      title: 'Royal walk',
      text: 'Walk the king to every star.',
      fen: only('8/8/8/8/8/8/8/4K3'),
      stars: ['e3', 'g4', 'f6'],
      hint: 'Diagonal steps count as one move too.',
      success: 'Well walked!',
    },
  ],
};

const knight: Lesson = {
  id: 'the-knight',
  title: 'The knight',
  summary: 'The L-shaped jumper.',
  minutes: 4,
  steps: [
    {
      kind: 'explain',
      title: 'The L-shape',
      text:
        'The **knight** moves in an **L**: two squares in one direction, then one square to the side.\n\nIt always lands on the **opposite color**. Worth about **3 points**.',
      fen: only('8/8/8/8/3N4/8/8/8'),
      highlights: ['c6', 'e6', 'f5', 'f3', 'e2', 'c2', 'b3', 'b5'],
      arrows: [['d4', 'e6']],
    },
    {
      kind: 'select',
      title: 'Find the landing squares',
      text: 'Click every square the knight on d4 can reach.',
      fen: only('8/8/8/8/3N4/8/8/8'),
      from: 'd4',
      hint: 'There are eight: two up and one across, two across and one up, and so on in each direction.',
      success: 'All eight! Knights in the center are powerful.',
    },
    {
      kind: 'select',
      title: 'It jumps!',
      text: 'The knight is the only piece that can **jump over** other pieces. Surrounded? No problem. Mark every square it can reach.',
      fen: only('8/8/8/2PPP3/2PNP3/2PPP3/8/8'),
      from: 'd4',
      hint: 'The pawns around it don’t matter. It still has the same eight squares.',
      success: 'Exactly: nothing can block a knight.',
    },
    {
      kind: 'stars',
      title: 'Knight’s tour',
      text: 'Collect the stars with your knight.',
      fen: only('8/8/8/8/8/8/8/1N6'),
      stars: ['c3', 'e4', 'f6', 'd7'],
      hint: 'Each star is exactly one knight jump from the previous one.',
      success: 'Knight moves mastered!',
    },
  ],
};

const pawn: Lesson = {
  id: 'the-pawn',
  title: 'The pawn',
  summary: 'Forward to move, diagonal to capture.',
  minutes: 4,
  steps: [
    {
      kind: 'explain',
      title: 'Forward march',
      text:
        'A **pawn** moves straight **forward one square**. On its very **first move** it may go **two** squares.\n\nPawns never move backward. Worth **1 point**, but they can become queens!',
      fen: only('8/8/8/8/8/8/4P3/8'),
      arrows: [['e2', 'e4']],
    },
    {
      kind: 'explain',
      title: 'Capturing diagonally',
      text:
        'Pawns **capture differently** from how they move: one square **diagonally forward**.\n\nHere the pawn can capture on d5 or f5, but it can’t move forward because the knight blocks it.',
      fen: only('8/8/8/3pnp2/4P3/8/8/8'),
      arrows: [
        ['e4', 'd5'],
        ['e4', 'f5'],
      ],
    },
    {
      kind: 'select',
      title: 'Your turn',
      text: 'Click every square the pawn on b2 can move to.',
      fen: only('8/8/8/8/8/2p5/1P6/8'),
      from: 'b2',
      hint: 'One step, two steps (first move), and a diagonal capture.',
      success: 'Right: b3, b4, and the capture on c3.',
    },
    {
      kind: 'stars',
      title: 'Pawn run',
      text: 'Collect the stars. The black pawn on e5 counts as a star: capture it!',
      fen: only('8/8/8/4p3/8/8/3P4/8'),
      stars: ['d4', 'e5', 'e7'],
      hint: 'Use the two-square first move, then capture diagonally.',
      success: 'Great pawn play!',
    },
  ],
};

const capturing: Lesson = {
  id: 'capturing',
  title: 'Capturing',
  summary: 'Take the enemy’s pieces.',
  minutes: 3,
  steps: [
    {
      kind: 'explain',
      title: 'How captures work',
      text:
        'To **capture**, move your piece onto a square occupied by an **enemy** piece. The enemy piece is removed from the board.\n\nYou can never capture your own pieces, and you can never capture the king; you trap him instead.',
      fen: only('8/8/8/8/1R2p3/8/8/8'),
      arrows: [['b4', 'e4']],
    },
    {
      kind: 'stars',
      title: 'Rook raid',
      text: 'Capture every black pawn with your rook. Black won’t move.',
      fen: only('8/1p6/8/8/1R2p3/8/8/4p3'),
      stars: ['b7', 'e4', 'e1'],
      hint: 'Plan a route: one pawn leads you to the next.',
      success: 'All captured!',
    },
    {
      kind: 'stars',
      title: 'Knight raid',
      text: 'Now capture both pawns with your knight.',
      fen: only('8/8/8/2p1p3/8/3N4/8/8'),
      stars: ['c5', 'e5'],
      hint: 'After the first capture, you may need to jump back before you can reach the second pawn.',
      success: 'Sneaky knight!',
    },
  ],
};

/* ───────────── Unit 3 · Special rules ───────────── */

const check: Lesson = {
  id: 'check',
  title: 'Check',
  summary: 'When the king is attacked.',
  minutes: 4,
  steps: [
    {
      kind: 'explain',
      title: 'Check!',
      text:
        'When a king is attacked, it is in **check**. Here the white rook attacks the black king.\n\nThe player in check **must** get out of check on their very next move.',
      fen: '4k3/8/8/8/8/8/8/4R1K1 b - - 0 1',
      arrows: [['e1', 'e8']],
    },
    {
      kind: 'explain',
      title: 'Three escapes',
      text:
        'There are only three ways out of check:\n\n**1. Move** the king to a safe square.\n**2. Block** the attack by putting a piece in the way.\n**3. Capture** the attacking piece.',
      fen: '4k3/8/8/8/8/8/8/4R1K1 b - - 0 1',
      highlights: ['d8', 'f8', 'd7', 'f7'],
    },
    {
      kind: 'move',
      title: 'Give check',
      text: 'Move your rook so it **gives check** to the black king.',
      fen: 'k7/8/8/8/8/8/8/1R4K1 w - - 0 1',
      solution: [{ accept: 'check' }],
      hint: 'Put the rook on the same file or rank as the black king.',
      success: 'Check! The black king is under attack.',
    },
    {
      kind: 'move',
      title: 'Escape by capturing',
      text: 'Your king is in check from the rook on e1, and it has no safe squares. Find the **only** move.',
      fen: 'k7/8/8/8/4Q3/8/5PPP/4r1K1 w - - 0 1',
      lastMove: ['e8', 'e1'],
      solution: [{ accept: ['e4e1'] }],
      hint: 'Can one of your pieces capture the attacker?',
      success: 'Captured! Your king is safe again.',
      illegal: 'That doesn’t get your king out of check.',
    },
    {
      kind: 'move',
      title: 'Escape by blocking',
      text: 'Check again, from the rook on a1. This time **block** it.',
      fen: 'k7/8/8/8/8/4B3/5PPP/r5K1 w - - 0 1',
      lastMove: ['a8', 'a1'],
      solution: [{ accept: ['e3c1'] }],
      hint: 'Put your bishop on the first rank, between the rook and your king.',
      success: 'Blocked! The bishop shields the king.',
      illegal: 'That doesn’t get your king out of check.',
    },
  ],
};

const checkmate: Lesson = {
  id: 'checkmate',
  title: 'Checkmate',
  summary: 'The goal of the game.',
  minutes: 4,
  steps: [
    {
      kind: 'explain',
      title: 'Game over',
      text:
        '**Checkmate** means the king is in check and **none** of the three escapes work. The game ends immediately and the side that gave checkmate **wins**.\n\nHere the black king is attacked by the rook and his own pawns block every escape. This is a **back-rank mate**.',
      fen: 'R5k1/5ppp/8/8/8/8/8/6K1 b - - 0 1',
      arrows: [['a8', 'g8']],
    },
    {
      kind: 'move',
      title: 'Back-rank mate',
      text: 'White to move. **Checkmate in one**.',
      fen: '6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1',
      solution: [{ accept: 'mate' }],
      hint: 'Black’s king is stuck behind his own pawns. Attack the back rank.',
      success: 'Checkmate! The pawns trap their own king.',
    },
    {
      kind: 'move',
      title: 'King and queen',
      text: 'Your king helps your queen. **Checkmate in one**.',
      fen: 'k7/8/1K6/8/8/8/8/7Q w - - 0 1',
      solution: [{ accept: 'mate' }],
      hint: 'Your king already guards a7 and b7. Check along the 8th rank.',
      success: 'Checkmate! Teamwork between king and queen.',
    },
  ],
};

const stalemate: Lesson = {
  id: 'stalemate',
  title: 'Stalemate',
  summary: 'The draw that ruins winning games.',
  minutes: 3,
  steps: [
    {
      kind: 'explain',
      title: 'No moves, no check',
      text:
        'If the player to move has **no legal moves** but is **not in check**, it is **stalemate**, and the game is a **draw**.\n\nHere Black’s king isn’t attacked, but every square around it is. Black can’t move: draw!',
      fen: 'k7/2Q5/1K6/8/8/8/8/8 b - - 0 1',
      highlights: ['a8', 'a7', 'b7', 'b8'],
    },
    {
      kind: 'move',
      title: 'Mate, not stalemate',
      text: 'You are winning. Deliver **checkmate**, but be careful not to stalemate!',
      fen: 'k7/8/1K6/8/8/8/8/2Q5 w - - 0 1',
      solution: [{ accept: 'mate' }],
      hint: 'Check the king along the 8th rank. Your king covers the escape squares.',
      success: 'Checkmate! You avoided the stalemate trap.',
      wrong: {
        c1c7: 'Stalemate! Black has no legal moves but isn’t in check. That’s a draw. Look for a check.',
      },
    },
  ],
};

const castling: Lesson = {
  id: 'castling',
  title: 'Castling',
  summary: 'The king’s special move.',
  minutes: 4,
  steps: [
    {
      kind: 'explain',
      title: 'King safety in one move',
      text:
        '**Castling** moves two pieces at once. The king moves **two squares** toward a rook, and that rook jumps to the square on the **other side** of the king.\n\nKingside: king e1→g1, rook h1→f1.',
      fen: 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1',
      arrows: [
        ['e1', 'g1'],
        ['h1', 'f1'],
      ],
    },
    {
      kind: 'explain',
      title: 'The rules',
      text:
        'You may castle only if:\n\n• neither the king nor that rook has moved yet;\n• there are no pieces between them;\n• the king is **not in check**, and does not **pass through** or **land on** an attacked square.',
      fen: 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1',
      highlights: ['f1', 'g1', 'b1', 'c1', 'd1'],
    },
    {
      kind: 'move',
      title: 'Castle kingside',
      text: 'Castle **kingside**: drag or click your king from e1 to g1.',
      fen: 'r1b1k2r/ppppqppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 0 1',
      solution: [{ accept: ['e1g1'] }],
      hint: 'Move the king two squares toward the h1 rook. The rook follows automatically.',
      success: 'Castled! Your king is tucked away safely.',
    },
    {
      kind: 'move',
      title: 'Castle queenside',
      text: 'Now castle **queenside**: king from e1 to c1.',
      fen: 'r3kb1r/ppp1pppp/2nq1n2/3p1b2/3P1B2/2NQ1N2/PPP1PPPP/R3KB1R w KQkq - 0 1',
      solution: [{ accept: ['e1c1'] }],
      hint: 'Two squares toward the a1 rook. The rook lands on d1.',
      success: 'Queenside castling, done!',
    },
    {
      kind: 'move',
      title: 'Which side?',
      text: 'The black bishop is watching one side. **Castle on the side that’s allowed.**',
      fen: 'r3k2r/8/8/8/2b5/8/8/R3K2R w KQkq - 0 1',
      solution: [{ accept: ['e1c1'] }],
      hint: 'The bishop on c4 attacks f1. The king can’t pass through an attacked square.',
      success: 'Correct. Kingside was illegal because f1 is attacked.',
      illegal: 'Not allowed: the king can’t pass through f1, which the bishop on c4 attacks.',
    },
  ],
};

const enPassant: Lesson = {
  id: 'en-passant',
  title: 'En passant',
  summary: 'The tricky pawn capture.',
  minutes: 3,
  steps: [
    {
      kind: 'explain',
      title: '“In passing”',
      text:
        'If an enemy pawn moves **two squares** and lands right **beside** your pawn, you may capture it **as if it had moved only one**.\n\nYou must do it **immediately**, on the very next move, or the chance is gone.',
      fen: only('8/8/8/3pP3/8/8/8/8'),
      lastMove: ['d7', 'd5'],
      arrows: [['e5', 'd6']],
    },
    {
      kind: 'move',
      title: 'Capture en passant',
      text: 'Black just played **d7–d5**. Capture that pawn **en passant**!',
      fen: fenAfter('e4 a6 e5 d5'),
      lastMove: ['d7', 'd5'],
      solution: [{ accept: ['e5d6'] }],
      hint: 'Move your e5 pawn diagonally to d6, the square the black pawn skipped over.',
      success: 'En passant! The d5 pawn is removed from the board.',
    },
  ],
};

const promotion: Lesson = {
  id: 'promotion',
  title: 'Promotion',
  summary: 'Pawns become queens.',
  minutes: 3,
  steps: [
    {
      kind: 'explain',
      title: 'Reaching the end',
      text:
        'When a pawn reaches the **last rank**, it **promotes**: it is replaced by a queen, rook, bishop or knight of your choice.\n\nAlmost always choose a **queen**.',
      fen: only('8/4P3/8/8/8/8/8/8'),
      arrows: [['e7', 'e8']],
    },
    {
      kind: 'move',
      title: 'Make a queen',
      text: 'Push your pawn and **promote it to a queen**.',
      fen: '8/1P4k1/8/8/8/8/6K1/8 w - - 0 1',
      solution: [{ accept: ['b7b8q'] }],
      hint: 'Move the b7 pawn forward, then pick the queen.',
      success: 'A brand-new queen!',
      wrong: {
        b7b8r: 'A rook is fine, but a queen is stronger. Try again and pick the queen.',
        b7b8b: 'A queen is much stronger than a bishop. Try again.',
        b7b8n: 'Knights have special uses, but here a queen is best.',
      },
    },
    {
      kind: 'move',
      title: 'Promote with mate',
      text: 'Promote with **checkmate**!',
      fen: '6k1/4P1pp/8/8/8/8/5PPP/6K1 w - - 0 1',
      solution: [{ accept: 'mate' }],
      hint: 'A new queen on e8 attacks the whole back rank.',
      success: 'Promotion and checkmate in one move!',
    },
  ],
};

/* ───────────── Unit 4 · Basic strategy ───────────── */

const values: Lesson = {
  id: 'piece-values',
  title: 'Piece values',
  summary: 'Know what each piece is worth.',
  minutes: 4,
  steps: [
    {
      kind: 'explain',
      title: 'Counting points',
      text:
        '**Pawn 1 · Knight 3 · Bishop 3 · Rook 5 · Queen 9.** The king can’t be traded, so he has no value: he’s priceless.\n\nUse these numbers to judge trades. Giving a knight (3) for a rook (5) wins material; giving your queen (9) for a bishop (3) loses a lot.',
      fen: only('8/8/8/8/PNBRQK2/8/8/8'),
    },
    {
      kind: 'move',
      title: 'Take the bigger prize',
      text: 'Your knight can capture two different pieces. Take the **more valuable** one.',
      fen: '6k1/8/4r3/5b2/3N4/8/8/6K1 w - - 0 1',
      solution: [{ accept: ['d4e6'] }],
      hint: 'A rook is worth 5, a bishop 3.',
      success: 'You won a rook: 5 points!',
      wrong: { d4f5: 'That wins a bishop (3), but the rook on e6 is worth 5. Try again.' },
    },
    {
      kind: 'move',
      title: 'Is it defended?',
      text: 'Before you capture, check whether the piece is **defended**. Win material **safely**.',
      fen: '6k1/5ppp/4p3/3n4/8/8/8/b2R2K1 w - - 0 1',
      solution: [{ accept: ['d1a1'] }],
      hint: 'One black piece is protected by a pawn; the other is completely free.',
      success: 'A free bishop, and your rook is safe.',
      wrong: {
        d1d5: 'The pawn on e6 defends that knight: after …exd5 you’d lose your rook (5) for a knight (3).',
      },
    },
  ],
};

const opening: Lesson = {
  id: 'opening-principles',
  title: 'Opening principles',
  summary: 'Center, develop, castle.',
  minutes: 5,
  steps: [
    {
      kind: 'explain',
      title: 'Three golden rules',
      text:
        '**1. Control the center**: the squares d4, e4, d5 and e5.\n**2. Develop** your knights and bishops quickly.\n**3. Castle early** to keep your king safe.',
      fen: START_FEN,
      highlights: ['d4', 'e4', 'd5', 'e5'],
    },
    {
      kind: 'move',
      title: 'Claim the center',
      text: 'Play a strong first move that puts a pawn in the **center**.',
      fen: START_FEN,
      solution: [{ accept: ['e2e4', 'd2d4'] }],
      hint: 'Push the e-pawn or the d-pawn two squares.',
      success: 'A central pawn also opens lines for your queen and bishop.',
    },
    {
      kind: 'move',
      title: 'Develop a knight',
      text: 'After 1.e4 e5, bring a **knight** out toward the center.',
      fen: fenAfter('e4 e5'),
      lastMove: ['e7', 'e5'],
      solution: [{ accept: ['g1f3', 'b1c3'] }],
      hint: 'Knights belong on f3 or c3, aiming at the center.',
      success: 'Good development. Remember: “a knight on the rim is dim.”',
      wrong: {
        g1h3: 'A knight on the rim is dim. On h3 it controls fewer squares. Aim for the center.',
        b1a3: 'A knight on the rim is dim. On a3 it controls fewer squares. Aim for the center.',
      },
    },
    {
      kind: 'move',
      title: 'Develop a bishop',
      text: 'Now develop your **light-squared bishop** to an active square.',
      fen: fenAfter('e4 e5 Nf3 Nc6'),
      lastMove: ['b8', 'c6'],
      solution: [{ accept: ['f1c4', 'f1b5'] }],
      hint: 'The bishop on f1 can go to c4 (aiming at f7) or b5.',
      success: 'Bishop out, and now you’re ready to castle.',
      wrong: {
        d1e2: 'Develop your minor pieces (knights and bishops) before the queen.',
      },
    },
    {
      kind: 'move',
      title: 'Castle!',
      text: 'Both sides have developed. Complete the opening: **castle kingside**.',
      fen: fenAfter('e4 e5 Nf3 Nc6 Bc4 Bc5'),
      lastMove: ['f8', 'c5'],
      solution: [{ accept: ['e1g1'] }],
      hint: 'King from e1 to g1.',
      success: 'Center ✓ Development ✓ King safety ✓. A model opening!',
    },
    {
      kind: 'explain',
      title: 'Common mistakes',
      text:
        'Avoid moving the **same piece twice** in the opening, and don’t bring the **queen out too early**: she gets chased around by enemy pieces while they develop.\n\nAnd don’t grab pawns at the cost of your development.',
      fen: fenAfter('e4 e5 Nf3 Nc6 Bc4 Bc5 O-O'),
    },
  ],
};

const tactics: Lesson = {
  id: 'forks',
  title: 'Tactics: the fork',
  summary: 'Attack two things at once.',
  minutes: 4,
  steps: [
    {
      kind: 'explain',
      title: 'Double attack',
      text:
        'A **fork** is when one piece attacks **two** enemy pieces at the same time. Your opponent can only save one of them.\n\nKnights are fork specialists. Here the knight attacks the king **and** the rook.',
      fen: 'r3k3/2N5/8/8/8/8/8/6K1 b - - 0 1',
      arrows: [
        ['c7', 'e8'],
        ['c7', 'a8'],
      ],
    },
    {
      kind: 'move',
      title: 'Find the fork',
      text: 'Fork the black **king and rook** with your knight, then collect the rook.',
      fen: 'r3k3/8/8/1N6/8/8/8/6K1 w - - 0 1',
      solution: [
        { accept: ['b5c7'], reply: 'e8e7' },
        { accept: ['c7a8'], prompt: 'The king had to move. Now **take the rook**!' },
      ],
      hint: 'Look for a square where the knight attacks both e8 and a8.',
      success: 'Fork complete: you won a whole rook.',
    },
    {
      kind: 'move',
      title: 'Pawn fork',
      text: 'Even a humble pawn can fork. Attack **both** black pieces with one pawn move.',
      fen: 'k7/8/3r1n2/8/4P3/8/8/K7 w - - 0 1',
      solution: [{ accept: ['e4e5'] }],
      hint: 'A pawn on e5 attacks d6 and f6.',
      success: 'Pawn fork! Black will lose a rook or a knight to a pawn.',
    },
  ],
};

const mates: Lesson = {
  id: 'basic-mates',
  title: 'Basic checkmates',
  summary: 'The ladder and the king-and-queen mate.',
  minutes: 4,
  steps: [
    {
      kind: 'explain',
      title: 'The ladder',
      text:
        'Two rooks (or a rook and queen) can force mate by taking turns: one rook **guards a rank** while the other **gives check** on the next one, pushing the king to the edge like climbing a ladder.',
      fen: only('3k4/8/R7/8/8/8/1R6/7K'),
      highlights: rankSquares(6),
    },
    {
      kind: 'move',
      title: 'Climb the ladder',
      text: 'Checkmate in **two moves**. Start with a check on the 7th rank.',
      fen: '8/3k4/R7/8/8/8/8/1R5K w - - 0 1',
      solution: [
        { accept: ['b1b7'], reply: 'd7e8' },
        { accept: 'mate', prompt: 'The king retreated to the back rank. Now **finish it**!' },
      ],
      hint: 'The rook on a6 guards the 6th rank. Check from b7, then mate on the 8th rank.',
      success: 'Ladder mate!',
    },
    {
      kind: 'move',
      title: 'King and queen',
      text: 'The kings face each other. **Checkmate in one**.',
      fen: '3k4/8/3K4/8/8/8/8/7Q w - - 0 1',
      solution: [{ accept: 'mate' }],
      hint: 'Your king covers c7, d7 and e7. Check along the back rank.',
      success: 'Checkmate!',
    },
    {
      kind: 'explain',
      title: 'Course complete',
      text:
        'Congratulations! You know the board, how every piece moves, the special rules, and the first ideas of strategy.\n\nNext steps: play slow games, solve a few puzzles every day, and keep sharpening your board vision in the **Train** tab.',
      fen: START_FEN,
    },
  ],
};

export const COURSE: readonly Unit[] = [
  {
    id: 'board',
    title: 'The board',
    description: 'Learn your way around the 64 squares and set up the pieces.',
    glyph: '♙',
    lessons: [meetTheBoard, setup],
  },
  {
    id: 'pieces',
    title: 'How the pieces move',
    description: 'Every piece, its moves, and how to capture.',
    glyph: '♘',
    lessons: [rook, bishop, queen, king, knight, pawn, capturing],
  },
  {
    id: 'rules',
    title: 'Special rules',
    description: 'Check, checkmate, stalemate, castling, en passant and promotion.',
    glyph: '♔',
    lessons: [check, checkmate, stalemate, castling, enPassant, promotion],
  },
  {
    id: 'strategy',
    title: 'Basic strategy',
    description: 'Piece values, opening principles, forks and simple mates.',
    glyph: '♕',
    lessons: [values, opening, tactics, mates],
  },
];

export const ALL_LESSONS: readonly Lesson[] = COURSE.flatMap((u) => u.lessons);

export const findLesson = (id: string) => {
  for (const unit of COURSE) {
    const index = unit.lessons.findIndex((l) => l.id === id);
    if (index >= 0) return { unit, lesson: unit.lessons[index], index };
  }
  return null;
};

export const nextLessonId = (id: string): string | null => {
  const i = ALL_LESSONS.findIndex((l) => l.id === id);
  return i >= 0 && i < ALL_LESSONS.length - 1 ? ALL_LESSONS[i + 1].id : null;
};
