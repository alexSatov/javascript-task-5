'use strict';

function EventContext(context, handlers) {
    this.context = context;
    this.handlers = handlers;
}

function getSubEvents(event) {
    const subEvents = [];
    const events = event.split('.');

    while (events.length !== 0) {
        subEvents.push(events.join('.'));
        events.pop();
    }

    return subEvents;
}

function isSubEvent(subEvent, event) {
    return subEvent === event || event.startsWith(subEvent + '.');
}

function isEventIndexSuitable(eventIndex, eventContext) {
    const times = eventContext.times;
    const freq = eventContext.frequency;

    return times === undefined && freq === undefined || (
        times !== undefined && eventIndex <= times ||
        freq !== undefined && ((eventIndex - 1) % freq === 0 || eventIndex === 1));
}

function findEventContext(context, eventContexts) {
    return eventContexts.filter(evCont => evCont.context === context).pop();
}

/**
 * Сделано задание на звездочку
 * Реализованы методы several и through
 */
getEmitter.isStar = true;
module.exports = getEmitter;

/**
 * Возвращает новый emitter
 * @returns {Object}
 */
function getEmitter() {
    return {
        events: {},
        eventsLog: {},

        /**
         * Подписаться на событие
         * @param {String} event
         * @param {Object} context
         * @param {Function} handler
         * @returns {Object} - emitter
         */
        on: function (event, context, handler) {
            if (event in this.events) {
                const eventContext = findEventContext(context, this.events[event]);

                if (eventContext !== undefined) {
                    eventContext.handlers.push(handler);
                } else {
                    this.events[event].push(new EventContext(context, [handler]));
                }
            } else {
                this.events[event] = [new EventContext(context, [handler])];
            }

            return this;
        },

        /**
         * Отписаться от события
         * @param {String} event
         * @param {Object} context
         * @returns {Object} - emitter
         */
        off: function (event, context) {
            const eventsToOff = Object.keys(this.events).filter(e => isSubEvent(event, e));

            for (let eventToOff of eventsToOff) {
                this.events[eventToOff] = this.events[eventToOff]
                    .filter(eventContext => eventContext.context !== context);
            }

            return this;
        },

        /**
         * Уведомить о событии
         * @param {String} event
         * @returns {Object} - emitter
         */
        emit: function (event) {
            const eventsToEmit = getSubEvents(event);

            while (eventsToEmit.length !== 0) {
                event = eventsToEmit.shift();

                this.eventsLog[event] = event in this.eventsLog ? this.eventsLog[event] + 1 : 1;
                const eventIndex = this.eventsLog[event];

                if (event in this.events) {
                    this.events[event].forEach(
                        evCont => {
                            if (isEventIndexSuitable(eventIndex, evCont)) {
                                evCont.handlers.forEach(h => h.call(evCont.context));
                            }
                        }
                    );
                }
            }

            return this;
        },

        /**
         * Подписаться на событие с ограничением по количеству полученных уведомлений
         * @star
         * @param {String} event
         * @param {Object} context
         * @param {Function} handler
         * @param {Number} times – сколько раз получить уведомление
         * @returns {Object} - emitter
         */
        several: function (event, context, handler, times) {
            this.on(event, context, handler);

            if (times > 0) {
                const eventContext = findEventContext(context, this.events[event]);
                eventContext.times = times;
            }

            return this;
        },

        /**
         * Подписаться на событие с ограничением по частоте получения уведомлений
         * @star
         * @param {String} event
         * @param {Object} context
         * @param {Function} handler
         * @param {Number} frequency – как часто уведомлять
         * @returns {Object} - emitter
         */
        through: function (event, context, handler, frequency) {
            this.on(event, context, handler);

            if (frequency > 0) {
                const eventContext = findEventContext(context, this.events[event]);
                eventContext.frequency = frequency;
            }

            return this;
        }
    };
}
