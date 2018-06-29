import Clocks from 'dvbcss-clocks';
import Sequence from './sequence';
import OutputRouter from './output-router';
import SyncPlayers from '../sync-players';

const { CorrelatedClock } = Clocks;
const { SyncController, BufferPlayer, DashPlayer } = SyncPlayers;

/**
 * @typedef {Object} ActiveSequenceItem
 * @property {CorrelatedClock} clock
 * @property {Player} player
 * @property {SyncController} controller
 */

/**
 * @class
 * @desc
 * The SynchronisedSequenceRenderer is responsible for orchestrating all audio sources related to a
 * {@link Sequence} on the device it is running on.
 */
class SynchronisedSequenceRenderer {
  /**
   * @param {AudioContext} audioContext
   * @param {CorrelatedClock} clock
   * @param {Sequence} sequence
   */
  constructor(audioContext, clock, sequence, isStereo) {
    /**
     * @type {AudioContext}
     * @private
     */
    this._audioContext = audioContext;

    /**
     * @type {CorrelatedClock}
     * @private
     */
    this._clock = clock;

    /**
     * @type {Sequence}
     * @private
     */
    this._sequence = sequence;

    /**
     * @type {boolean}
     * @private
     */
    this._isStereo = isStereo;

    /**
     * @type {Array<string>}
     * @private
     */
    this._activeObjectIds = [];

    /**
     * @type {Array}
     * @private
     */
    this._activePlaybackItems = {};

    /**
     * @type {Map<ActiveSequenceItem>}
     * @private
     */
    this._activeItems = new Map();

    /**
     * @type {number}
     * How far in advance are items downloaded and scheduled (seconds).
     *
     * @private
     */
    this._lookaheadDuration = 2.0;

    /**
     * @type {fadeInDuration}
     * How long does the transition on newly enabled objects last (seconds).
     */
    this.fadeInDuration = 0.2;

    /**
     * @type {fadeOutDuration}
     * How long does the transition on newly removed objects last (seconds).
     */
    this.fadeOutDuration = 0.2;

    /**
     * @type {RendererOutputRouter}
     * @private
     */
    this._output = new OutputRouter(this._audioContext, this._isStereo);

    // listen for changes to the master clock object
    this._clock.on('change', this.notify.bind(this));
    setInterval(this.notify.bind(this), 1000 * (this._lookaheadDuration / 2));
  }

  /**
   * Replace the set of active objects. Will cause new objects to start playing according to the
   * sequence and fade in, and removed objects to fade out immediately.
   *
   * @param {Array<string>} newObjectIds
   */
  setActiveObjectIds(newObjectIds) {
    // trigger addition of objects not present in old list
    newObjectIds
      .filter(objectId => !this._activeObjectIds.includes(objectId))
      .forEach(objectId => this.addObject(objectId));

    // trigger removal of objects not present in new list
    this._activeObjectIds
      .filter(objectId => !newObjectIds.includes(objectId))
      .forEach(objectId => this.removeObject(objectId));

    // update the audio graph and player instances
    this.notify();
  }

  /**
   * Get a copy of the list of active object ids.
   *
   * @returns {Array<string>}
   */
  get activeObjectIds() {
    return this._activeObjectIds.slice();
  }

  /**
   * Get a copy of the sequence being played by this Renderer
   *
   * @returns {Sequence}
   */
  get sequence() {
    // create a deep copy by serialising and deserialising
    return Sequence.deserialise(this._sequence.serialise());
  }

  /**
   * Get an output gain node that can be connected to any further processing.
   *
   * It has a single output, that can have either one or two channels.
   *
   * @returns {GainNode}
   */
  get output() {
    return this._output.output;
  }

  /**
   * Notify this object that something changed and requires attention.
   *
   * Changes the audio routing graph, schedules parameter updates, and creates players as required.
   *
   * @private
   */
  notify() {
    // console.debug('SSR: notify', this._sequence, this._activeObjectIds);

    // find all active items (active now up to lookaheadDuration) for all active and valid objects.
    const activeItems = this._activeObjectIds
      .filter(objectId => this._sequence.objectIds.includes(objectId))
      .map(objectId => this._sequence.items(objectId, this._clock.now()))
      .reduce((acc, a) => acc.concat(a), [])
      .filter(item => item.start <= this._clock.now() + this._lookaheadDuration);

    const activeItemIds = activeItems.map(item => item.itemId);

    activeItems.forEach(({
      itemId,
      start,
      duration,
      source,
    }) => {
      // Do nothing if the item has already been scheduled.
      if (this._activeItems.has(itemId)) {
        return;
      }

      // otherwise create the clock, player, and sync controller.
      const activeItem = {
        clock: new CorrelatedClock(this._clock, {
          correlation: [start, 0],
          speed: 1,
          tickRate: 1,
        }),
        player: null,
        syncController: null,
      };

      if (source.type === 'dash') {
        activeItem.player = new DashPlayer(
          this._audioContext,
          source.url,
          [source.adaptationSetId],
        );
      } else if (source.type === 'buffer') {
        activeItem.player = new BufferPlayer(
          this._audioContext,
          source.url,
        );
      } else {
        throw new Error(`Cannot create a player for unknown source type ${source.type}`);
      }

      activeItem.player.prepare()
        .then(() => {
          activeItem.syncController = new SyncController(
            activeItem.clock,
            activeItem.player,
            0,
          );
        })
        .then(() => {
          switch (this._isStereo ? source.channelMapping : 'mono') {
            case 'stereo':
              activeItem.player.outputs[0].connect(this._output.left);
              activeItem.player.outputs[1].connect(this._output.right);
              break;
            case 'left':
              activeItem.player.outputs[0].connect(this._output.left);
              break;
            case 'right':
              activeItem.player.outputs[0].connect(this._output.right);
              break;
            case 'mono':
            default:
              activeItem.player.outputs[0].connect(this._output.mono);
              break;
          }
        });

      this._activeItems.set(itemId, activeItem);
    });

    // stop all abandoned currently active players that don't correspond to an enabled object.
    const abandonedItemIds = Array.from(this._activeItems.keys())
      .filter(itemId => !activeItemIds.includes(itemId));

    if (activeItemIds.filter(a => !this._activeItems.has(a.itemId)).length > 1) {
      console.debug(`Active items: ${activeItemIds}.`);
    }
    if (abandonedItemIds.length > 0) {
      console.debug(`Abandoned items: ${abandonedItemIds}`);
    }

    Array.from(this._activeItems.keys())
      .filter(key => !activeItemIds.includes(key)) // stop all not in activeItemIds
      .forEach((itemId) => {
        const { player, clock, syncController } = this._activeItems.get(itemId);
        player.outputs.forEach(output =>
          output.gain.exponentialRampToValueAtTime(0.1, 2 * this.fadeOutDuration));
        setTimeout(() => {
          clock.setSpeed(0);
          syncController.stop();
          player.outputs.forEach(output => output.disconnect());
        }, this.fadeOutDuration);
        this._activeItems.delete(itemId);
      });
  }

  /**
   * Handle addition of an object.
   *
   * Add it to the list of active objects, and the next {@link notify} call will create the players
   * and schedule the fade-in once the player has started playing.
   *
   * @param {string} objectId
   * @private
   */
  addObject(objectId) {
    this._activeObjectIds = [...this.activeObjectIds, objectId];
  }

  /**
   * Handle removal of an object.
   *
   * If any players are associated with this object, they will fade out and then be destroyed.
   *
   * @param {string} objectId
   * @private
   */
  removeObject(objectId) {
    this._activeObjectIds = this._activeObjectIds.filter(o => o !== objectId);
  }
}

export default SynchronisedSequenceRenderer;
