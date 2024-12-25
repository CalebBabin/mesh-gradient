
export class EventEmitter {
	/**
	 * @private
	 * @default Map<string, any>
	 */
	events = new Map();

	/**
	 * @private
	 * @default false
	 */
	pending = false;

	/**
	 * @private
	 */
	pendingData;

	/**
	 * @param {string} event
	 * @param {any} value
	 * @param {boolean} [debounce=true]
	 * @returns {void}
	 */
	broadcast(event, value, debounce = true) {
		if (!debounce) {
			const listeners = this.events.get(event);
			if (!listeners)
				return;
			for (let i = 0; i < listeners.length; i++) {
				listeners[i](value);
			}
			return;
		}
		this.pendingData = value;
		if (this.pending)
			return;
		this.pending = true;
		setTimeout(() => {
			this.pending = false;
			const listeners = this.events.get(event);
			if (!listeners)
				return;
			for (let i = 0; i < listeners.length; i++) {
				listeners[i](this.pendingData);
			}
		}, 1);
	}

	/**
	 * @param {string} event
	 * @param {(data: any) => void} listener
	 * @returns {void}
	 */

	on(event, listener) {
		if (this.events.has(event)) {
			this.events.get(event)?.push(listener);
		}
		else {
			this.events.set(event, [listener]);
		}
	}

	/**
	 * @param {string} event
	 * @param {(data: any) => void} listener
	 * @returns {void}
	 */
	off(event, listener) {
		const listeners = this.events.get(event);
		if (!listeners)
			return;
		for (let i = listeners.length - 1; i >= 0; i--) {
			if (listeners[i] === listener) {
				listeners.splice(i, 1);
			}
		}
	}
}
