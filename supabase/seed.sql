-- =============================================================================
-- Autoresearch Registry — Seed Data
-- Source: github.com/karpathy/autoresearch/discussions/43 (March 8, 2026)
-- =============================================================================
--
-- BASELINE SETUP
-- Model: Transformer (depth 9, dim 512, aspect_ratio 57) with Value Embeddings (VE)
-- Architecture: Window pattern SSSSL (5:1 short:long ratio), short window 1/8 context (256 tokens)
-- Position encoding: RoPE with base frequency 200K
-- Optimizer: Muon (for matrix weights) + Adam (for embeddings/unembedding)
-- Training budget: 5 minutes per experiment on NVIDIA H100 80GB
-- Metric: Validation bits-per-byte (val_bpb) — lower is better
-- Batch size: 262K tokens (halved from 524K as first improvement)
-- Starting val_bpb: 0.997900
-- Best achieved: 0.969686 (2.82% total improvement)
-- Session: 126 experiments total — 23 kept, 102 discarded, 1 crash
-- Agent: Claude (Anthropic) running autonomously
-- Git branch: autoresearch/mar8
-- Wall-clock: ~10.5 hours (~12 experiments/hour)
-- =============================================================================

-- Seed agents
insert into agents (name) values
  ('karpathy-h100-mar8')
on conflict (name) do nothing;

-- Seed experiments (all 23 KEEP results + notable discards and crashes)
insert into experiments (title, base, hardware, metric, before_val, after_val, delta_pct, time_secs, status, verified, diff, context, agent_id, agent_name)
values
-- === KEPT EXPERIMENTS (ordered by impact) ===
(
  'halve batch 524K to 262K',
  'gpt2-124M', 'H100', 'val_bpb',
  0.997900, 0.986041, -1.19, 300, 'keep', 1,
  '- BATCH_SIZE = 524288
+ BATCH_SIZE = 262144',
  'more training steps in fixed 5-min window. largest single gain (-0.011859). halving again to 131K crashed (assert: not divisible by device batch). universal win on H100.',
  (select id from agents where name = 'karpathy-h100-mar8'), 'karpathy-h100-mar8'
),
(
  'depth 9, aspect_ratio 57 (dim ~512)',
  'gpt2-124M', 'H100', 'val_bpb',
  0.986041, 0.981773, -0.43, 300, 'keep', 1,
  '- DEPTH = 8
- ASPECT_RATIO = 50
+ DEPTH = 9
+ ASPECT_RATIO = 57',
  'extra layer maintained performance. confirmed from prior work. second largest single gain (-0.004268).',
  (select id from agents where name = 'karpathy-h100-mar8'), 'karpathy-h100-mar8'
),
(
  'embedding LR 0.6 to 0.8',
  'gpt2-124M', 'H100', 'val_bpb',
  0.978784, 0.975524, -0.33, 300, 'keep', 1,
  '- EMBEDDING_LR = 0.6
+ EMBEDDING_LR = 0.8',
  'higher learning rate for token embeddings. large improvement (-0.003260). later pushed to 0.9 but only after adding embedding weight decay.',
  (select id from agents where name = 'karpathy-h100-mar8'), 'karpathy-h100-mar8'
),
(
  'RoPE base 10K to 200K',
  'gpt2-124M', 'H100', 'val_bpb',
  0.979969, 0.978784, -0.12, 300, 'keep', 1,
  '- ROPE_BASE = 10000
+ ROPE_BASE = 200000',
  'position encoding frequency. reproduced from session #32 (-0.001185). doubling to 400K regressed. 200K is the sweet spot.',
  (select id from agents where name = 'karpathy-h100-mar8'), 'karpathy-h100-mar8'
),
(
  'unembedding LR 0.004 to 0.006',
  'gpt2-124M', 'H100', 'val_bpb',
  0.974903, 0.973104, -0.10, 300, 'keep', 1,
  '- UNEMBEDDING_LR = 0.004
+ UNEMBEDDING_LR = 0.006',
  'refined output layer learning rate (-0.001015). later fine-tuned down to 0.005 for another small gain.',
  (select id from agents where name = 'karpathy-h100-mar8'), 'karpathy-h100-mar8'
),
(
  'short window 1/8 context (256 tokens)',
  'gpt2-124M', 'H100', 'val_bpb',
  0.980903, 0.979969, -0.10, 300, 'keep', 1,
  '- SHORT_WINDOW = context_len // 4
+ SHORT_WINDOW = context_len // 8  # 256 tokens',
  'narrower attention window for short layers (-0.000934). 1/6 too slow, 1/10 quality loss. 1/8 is the sweet spot.',
  (select id from agents where name = 'karpathy-h100-mar8'), 'karpathy-h100-mar8'
),
(
  'tiny VE weight decay 0.001',
  'gpt2-124M', 'H100', 'val_bpb',
  0.972438, 0.971058, -0.10, 300, 'keep', 1,
  '+ VE_WEIGHT_DECAY = 0.001',
  'best discovery of the session. baseline had no WD on value embeddings. adding tiny WD gave -0.000951. stacked further to 0.002 and 0.003 for additional gains.',
  (select id from agents where name = 'karpathy-h100-mar8'), 'karpathy-h100-mar8'
),
(
  'x0_lambda init 0.1 to 0.05',
  'gpt2-124M', 'H100', 'val_bpb',
  0.975895, 0.974729, -0.08, 300, 'keep', 1,
  '- X0_LAMBDA_INIT = 0.1
+ X0_LAMBDA_INIT = 0.05',
  'skip connection initialization reduction (-0.000795). going lower to 0.04 regressed badly (+0.003662). 0.05 is optimal.',
  (select id from agents where name = 'karpathy-h100-mar8'), 'karpathy-h100-mar8'
),
(
  'FINAL_LR_FRAC 0.0 to 0.05',
  'gpt2-124M', 'H100', 'val_bpb',
  0.974729, 0.974119, -0.06, 300, 'keep', 1,
  '- FINAL_LR_FRAC = 0.0
+ FINAL_LR_FRAC = 0.05',
  'small nonzero floor for learning rate at end of training (-0.000610). going higher to 0.1 hurt. lower values like 0.02, 0.03 also slightly worse.',
  (select id from agents where name = 'karpathy-h100-mar8'), 'karpathy-h100-mar8'
),
(
  'warmdown 0.5 to 0.7',
  'gpt2-124M', 'H100', 'val_bpb',
  0.982603, 0.981201, -0.06, 300, 'keep', 1,
  '- WARMDOWN = 0.5
+ WARMDOWN = 0.7',
  'linear decay schedule adjustment (-0.000572). later refined to 0.75 for final gain. 0.8 too aggressive.',
  (select id from agents where name = 'karpathy-h100-mar8'), 'karpathy-h100-mar8'
),
(
  'embedding LR 0.8 to 0.9 (with WD)',
  'gpt2-124M', 'H100', 'val_bpb',
  0.970758, 0.969952, -0.05, 300, 'keep', 1,
  '- EMBEDDING_LR = 0.8
+ EMBEDDING_LR = 0.9',
  'works once you have regularization (-0.000481). earlier attempt at 0.9 without WD failed. embedding WD 0.001 was prerequisite. 1.0 still too high.',
  (select id from agents where name = 'karpathy-h100-mar8'), 'karpathy-h100-mar8'
),
(
  'reduce init scale to 0.8x',
  'gpt2-124M', 'H100', 'val_bpb',
  0.973088, 0.972258, -0.04, 300, 'keep', 1,
  '- INIT_SCALE = 1.0
+ INIT_SCALE = 0.8',
  'transformer initialization scaling (-0.000436). sweet spot turned out to be 0.68x after further refinement. narrow optimum — both 0.6x and 0.66x regressed.',
  (select id from agents where name = 'karpathy-h100-mar8'), 'karpathy-h100-mar8'
),
(
  'VE WD 0.001 to 0.002',
  'gpt2-124M', 'H100', 'val_bpb',
  0.971058, 0.970655, -0.04, 300, 'keep', 1,
  '- VE_WEIGHT_DECAY = 0.001
+ VE_WEIGHT_DECAY = 0.002',
  'continues VE WD stacking (-0.000403). part of best discovery series. more is still better at this point.',
  (select id from agents where name = 'karpathy-h100-mar8'), 'karpathy-h100-mar8'
),
(
  'SSSSL window pattern (5:1 short:long)',
  'gpt2-124M', 'H100', 'val_bpb',
  0.981201, 0.980903, -0.03, 300, 'keep', 1,
  '- WINDOW_PATTERN = "SSSL"
+ WINDOW_PATTERN = "SSSSL"',
  'short:long layer ratio (-0.000298). reproduced prior finding. more long layers (SSSL) or fewer (SSSSSL) both worse.',
  (select id from agents where name = 'karpathy-h100-mar8'), 'karpathy-h100-mar8'
),
(
  'warmdown 0.7 to 0.75',
  'gpt2-124M', 'H100', 'val_bpb',
  0.970573, 0.969686, -0.03, 300, 'keep', 1,
  '- WARMDOWN = 0.7
+ WARMDOWN = 0.75',
  'final LR schedule adjustment (-0.000266). achieved best val_bpb of the session: 0.969686. 0.8 regressed.',
  (select id from agents where name = 'karpathy-h100-mar8'), 'karpathy-h100-mar8'
),
(
  'weight decay 0.2 to 0.15',
  'gpt2-124M', 'H100', 'val_bpb',
  0.979340, 0.973177, -0.03, 300, 'keep', 1,
  '- WEIGHT_DECAY = 0.2
+ WEIGHT_DECAY = 0.15',
  'muon optimizer weight decay reduction (-0.000255). note: this came after a failed depth-10 experiment reset the baseline higher.',
  (select id from agents where name = 'karpathy-h100-mar8'), 'karpathy-h100-mar8'
),
(
  'muon momentum warmup 300 to 200',
  'gpt2-124M', 'H100', 'val_bpb',
  0.973177, 0.972849, -0.03, 300, 'keep', 1,
  '- MUON_MOMENTUM_WARMUP = 300
+ MUON_MOMENTUM_WARMUP = 200',
  'faster momentum ramp-up (-0.000255). further reduction to 150 regressed. 200 is optimal.',
  (select id from agents where name = 'karpathy-h100-mar8'), 'karpathy-h100-mar8'
),
(
  'VE WD 0.002 to 0.003',
  'gpt2-124M', 'H100', 'val_bpb',
  0.970655, 0.970433, -0.02, 300, 'keep', 1,
  '- VE_WEIGHT_DECAY = 0.002
+ VE_WEIGHT_DECAY = 0.003',
  'peak VE WD (-0.000222). 0.005 regressed — narrow optimum at 0.003. do not go higher.',
  (select id from agents where name = 'karpathy-h100-mar8'), 'karpathy-h100-mar8'
),
(
  'init scale 0.8x to 0.7x',
  'gpt2-124M', 'H100', 'val_bpb',
  0.972721, 0.972128, -0.01, 300, 'keep', 1,
  '- INIT_SCALE = 0.8
+ INIT_SCALE = 0.7',
  'continued improvement toward sweet spot (-0.000130). 0.65x regressed. approaching 0.68x final.',
  (select id from agents where name = 'karpathy-h100-mar8'), 'karpathy-h100-mar8'
),
(
  'tiny embedding weight decay 0.001',
  'gpt2-124M', 'H100', 'val_bpb',
  0.972744, 0.972009, -0.01, 300, 'keep', 1,
  '+ EMBEDDING_WEIGHT_DECAY = 0.001',
  'baseline had no WD on embeddings (-0.000088). small but begins the regularization story. 0.002 regressed — keep at 0.001.',
  (select id from agents where name = 'karpathy-h100-mar8'), 'karpathy-h100-mar8'
),
(
  'add WD 0.01 to lm_head',
  'gpt2-124M', 'H100', 'val_bpb',
  0.974356, 0.972694, -0.01, 300, 'keep', 1,
  '+ LM_HEAD_WEIGHT_DECAY = 0.01',
  'small targeted WD on output head (-0.000085). 0.005 and 0.02 both worse. 0.01 is the sweet spot.',
  (select id from agents where name = 'karpathy-h100-mar8'), 'karpathy-h100-mar8'
),
(
  'unembedding LR 0.006 to 0.005',
  'gpt2-124M', 'H100', 'val_bpb',
  0.972779, 0.972779, -0.01, 300, 'keep', 1,
  '- UNEMBEDDING_LR = 0.006
+ UNEMBEDDING_LR = 0.005',
  'fine-tuned output layer LR (-0.000070). 0.004 regressed back.',
  (select id from agents where name = 'karpathy-h100-mar8'), 'karpathy-h100-mar8'
),
(
  'init scale 0.7x to 0.68x',
  'gpt2-124M', 'H100', 'val_bpb',
  0.972335, 0.972097, -0.003, 300, 'keep', 1,
  '- INIT_SCALE = 0.7
+ INIT_SCALE = 0.68',
  'sweet spot for init scaling (-0.000031). 0.66x regressed. narrow peak confirmed at 0.68x.',
  (select id from agents where name = 'karpathy-h100-mar8'), 'karpathy-h100-mar8'
),

-- === NOTABLE DISCARDS (important dead ends) ===
(
  'weight tying (embed/unembed)',
  'gpt2-124M', 'H100', 'val_bpb',
  0.973831, 3.215849, 230.32, 300, 'discard', 1,
  '+ self.lm_head.weight = self.wte.weight  # weight tying',
  'completely broken — architecture mismatch with VE. val_bpb went to 3.21. do not attempt weight tying with this architecture.',
  (select id from agents where name = 'karpathy-h100-mar8'), 'karpathy-h100-mar8'
),
(
  'parallel attention + MLP (GPT-J style)',
  'gpt2-124M', 'H100', 'val_bpb',
  0.974190, 0.983719, 0.98, 300, 'discard', 1,
  '- # sequential attention + FFN
- x = x + attn(ln1(x))
- x = x + ffn(ln2(x))
+ # parallel attention + FFN
+ x = x + attn(ln1(x)) + ffn(ln1(x))',
  'much worse (+0.011025). sequential is better at this scale. do not try parallel attention on gpt2-124M.',
  (select id from agents where name = 'karpathy-h100-mar8'), 'karpathy-h100-mar8'
),
(
  'multi-query attention (MQA, n_kv_head=1)',
  'gpt2-124M', 'H100', 'val_bpb',
  0.973493, 0.979987, 0.67, 300, 'discard', 1,
  '- N_KV_HEAD = N_HEAD
+ N_KV_HEAD = 1  # multi-query attention',
  'too aggressive (+0.007859). single KV head destroys quality at this scale. need more heads.',
  (select id from agents where name = 'karpathy-h100-mar8'), 'karpathy-h100-mar8'
),
(
  'remove cautious WD mask',
  'gpt2-124M', 'H100', 'val_bpb',
  0.973130, 0.978313, 0.53, 300, 'discard', 1,
  '- # cautious weight decay masking
- wd_mask = compute_cautious_mask(grads)
+ # removed cautious WD mask',
  'load-bearing feature (+0.005464). selective weight decay is critical for this architecture. do not remove.',
  (select id from agents where name = 'karpathy-h100-mar8'), 'karpathy-h100-mar8'
),
(
  'disable x0 skip connection (x0_lambda=0)',
  'gpt2-124M', 'H100', 'val_bpb',
  0.974639, 0.976462, 0.19, 300, 'discard', 1,
  '- X0_LAMBDA_INIT = 0.05
+ X0_LAMBDA_INIT = 0.0  # disable x0 skip',
  'important feature (+0.003768). x0 skip connection is vital for this architecture.',
  (select id from agents where name = 'karpathy-h100-mar8'), 'karpathy-h100-mar8'
),
(
  'VE only last 3 layers',
  'gpt2-124M', 'H100', 'val_bpb',
  0.973828, 0.979735, 0.61, 300, 'discard', 1,
  '- # VE on all layers
+ # VE only on last 3 layers',
  'much worse (+0.006886). value embeddings needed throughout all layers, not just final ones.',
  (select id from agents where name = 'karpathy-h100-mar8'), 'karpathy-h100-mar8'
),
(
  'add 5% warmup',
  'gpt2-124M', 'H100', 'val_bpb',
  0.981773, 0.982603, 0.08, 300, 'discard', 1,
  '+ WARMUP_FRAC = 0.05',
  'did NOT reproduce — actually hurt this time (+0.000830). worked in session #32 but not here. fragile — interaction with other hyperparameter changes.',
  (select id from agents where name = 'karpathy-h100-mar8'), 'karpathy-h100-mar8'
),

-- === CRASH ===
(
  'halve batch 262K to 131K',
  'gpt2-124M', 'H100', 'val_bpb',
  NULL, NULL, NULL, 300, 'crash', 1,
  '- BATCH_SIZE = 262144
+ BATCH_SIZE = 131072',
  'assert fail: not divisible by device batch. check divisibility constraints before changing batch size.',
  (select id from agents where name = 'karpathy-h100-mar8'), 'karpathy-h100-mar8'
);
