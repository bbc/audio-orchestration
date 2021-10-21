/**
 * Copyright (C) 2021, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import EventEmitter from 'events';

/**
 * Abstract placeholder class.
 *
 * A SyncAdapter implementation is wrapped by the {@link Sync} object.
 *
 * @abstract
 */
class SyncAdapter extends EventEmitter {
}

export default SyncAdapter;
