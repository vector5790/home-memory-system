# 电子影音命名检索评测

电子影音 hard-negative 命名评测。包含用户客厅图审核框，以及相似电子类淘宝 gallery holdout（检索时排除自身 sample）。

- 样本数: 16
- Top1: 0.25
- Top3: 0.3125
- 接受后准确率: 0
- 拒识率: 1

## 混淆

- bookshelf-speaker -> REJECTED: 2
- television -> REJECTED: 1
- stereo-amplifier -> REJECTED: 1
- turntable -> REJECTED: 1
- floor-standing-air-conditioner -> REJECTED: 1
- projector -> REJECTED: 1
- set-top-box -> REJECTED: 1
- tv-box -> REJECTED: 1
- media-player -> REJECTED: 1
- cd-player -> REJECTED: 1
- dvd-blu-ray-player -> REJECTED: 1
- av-receiver -> REJECTED: 1
- soundbar -> REJECTED: 1
- powered-speaker -> REJECTED: 1
- floorstanding-speaker -> REJECTED: 1

## 样例

- living-room-television: expected=television, top1=peeler, rejected=true, top3=peeler,pet-toothbrush,trash-can-liner
- living-room-stereo-amplifier: expected=stereo-amplifier, top1=stereo-amplifier, rejected=true, top3=stereo-amplifier,projector,dvd-blu-ray-player
- living-room-turntable: expected=turntable, top1=dvd-blu-ray-player, rejected=true, top3=dvd-blu-ray-player,projector,turntable
- living-room-left-bookshelf-speaker: expected=bookshelf-speaker, top1=deodorant-stick, rejected=true, top3=deodorant-stick,doormat,cooling-mat
- living-room-right-bookshelf-speaker: expected=bookshelf-speaker, top1=capsule-bottle, rejected=true, top3=capsule-bottle,foam-roller,doormat
- living-room-floor-standing-air-conditioner: expected=floor-standing-air-conditioner, top1=kitchen-paper-roll, rejected=true, top3=kitchen-paper-roll,quilt,kitchen-scale
- gallery-holdout-projector: expected=projector, top1=projector, rejected=true, top3=projector,security-camera,hanging-storage-bag
- gallery-holdout-set-top-box: expected=set-top-box, top1=descaling-agent-bottle, rejected=true, top3=descaling-agent-bottle,century-egg-pack,water-filter-cartridge
- gallery-holdout-tv-box: expected=tv-box, top1=tv-box, rejected=true, top3=tv-box,media-player,router
- gallery-holdout-media-player: expected=media-player, top1=camera-battery, rejected=true, top3=camera-battery,dvd-blu-ray-player,projector
- gallery-holdout-cd-player: expected=cd-player, top1=security-camera, rejected=true, top3=security-camera,robot-vacuum,smoke-alarm
- gallery-holdout-dvd-blu-ray-player: expected=dvd-blu-ray-player, top1=card-game-box, rejected=true, top3=card-game-box,turntable,serving-tray
- gallery-holdout-av-receiver: expected=av-receiver, top1=stereo-amplifier, rejected=true, top3=stereo-amplifier,projector,floorstanding-speaker
- gallery-holdout-soundbar: expected=soundbar, top1=utility-knife, rejected=true, top3=utility-knife,essential-oil-bottle,wall-switch-panel
- gallery-holdout-powered-speaker: expected=powered-speaker, top1=powered-speaker, rejected=true, top3=powered-speaker,bookshelf-speaker,floorstanding-speaker
- gallery-holdout-floorstanding-speaker: expected=floorstanding-speaker, top1=bookshelf-speaker, rejected=true, top3=bookshelf-speaker,powered-speaker,stereo-amplifier

