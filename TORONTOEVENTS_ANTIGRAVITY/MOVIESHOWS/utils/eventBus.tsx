/**
 * UPDATE #119: Event-Driven Architecture
 * Event bus and event sourcing
 */

type EventHandler<T = any> = (event: Event<T>) => void | Promise<void>;

interface Event<T = any> {
    id: string;
    type: string;
    payload: T;
    timestamp: string;
    userId?: number;
    metadata?: Record<string, any>;
}

class EventBus {
    private handlers: Map<string, Set<EventHandler>> = new Map();
    private eventLog: Event[] = [];
    private maxLogSize = 1000;

    /**
     * Subscribe to event
     */
    on<T = any>(eventType: string, handler: EventHandler<T>): () => void {
        if (!this.handlers.has(eventType)) {
            this.handlers.set(eventType, new Set());
        }

        this.handlers.get(eventType)!.add(handler as EventHandler);

        // Return unsubscribe function
        return () => {
            this.handlers.get(eventType)?.delete(handler as EventHandler);
        };
    }

    /**
     * Subscribe to event once
     */
    once<T = any>(eventType: string, handler: EventHandler<T>): void {
        const wrappedHandler: EventHandler<T> = async (event) => {
            await handler(event);
            this.handlers.get(eventType)?.delete(wrappedHandler as EventHandler);
        };

        this.on(eventType, wrappedHandler);
    }

    /**
     * Emit event
     */
    async emit<T = any>(
        eventType: string,
        payload: T,
        metadata?: Record<string, any>
    ): Promise<void> {
        const event: Event<T> = {
            id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: eventType,
            payload,
            timestamp: new Date().toISOString(),
            metadata
        };

        // Add to event log
        this.eventLog.push(event);
        if (this.eventLog.length > this.maxLogSize) {
            this.eventLog.shift();
        }

        // Call handlers
        const handlers = this.handlers.get(eventType);
        if (handlers) {
            const promises = Array.from(handlers).map(handler =>
                Promise.resolve(handler(event)).catch(error => {
                    console.error(`Error in event handler for ${eventType}:`, error);
                })
            );
            await Promise.all(promises);
        }
    }

    /**
     * Get event log
     */
    getEventLog(filter?: { type?: string; since?: string }): Event[] {
        let events = this.eventLog;

        if (filter?.type) {
            events = events.filter(e => e.type === filter.type);
        }

        if (filter?.since) {
            const sinceDate = new Date(filter.since);
            events = events.filter(e => new Date(e.timestamp) > sinceDate);
        }

        return events;
    }

    /**
     * Replay events
     */
    async replay(events: Event[]): Promise<void> {
        for (const event of events) {
            await this.emit(event.type, event.payload, event.metadata);
        }
    }

    /**
     * Clear event log
     */
    clearLog(): void {
        this.eventLog = [];
    }
}

export const eventBus = new EventBus();

/**
 * Domain Events
 */
export const DomainEvents = {
    // User events
    USER_REGISTERED: 'user.registered',
    USER_LOGGED_IN: 'user.logged_in',
    USER_LOGGED_OUT: 'user.logged_out',
    USER_UPDATED: 'user.updated',

    // Content events
    MOVIE_ADDED: 'movie.added',
    MOVIE_UPDATED: 'movie.updated',
    MOVIE_DELETED: 'movie.deleted',
    MOVIE_VIEWED: 'movie.viewed',

    // Subscription events
    SUBSCRIPTION_CREATED: 'subscription.created',
    SUBSCRIPTION_UPDATED: 'subscription.updated',
    SUBSCRIPTION_CANCELED: 'subscription.canceled',
    SUBSCRIPTION_RENEWED: 'subscription.renewed',

    // Interaction events
    FAVORITE_ADDED: 'favorite.added',
    FAVORITE_REMOVED: 'favorite.removed',
    COMMENT_ADDED: 'comment.added',
    RATING_ADDED: 'rating.added'
};

/**
 * Event Sourcing Store
 */
class EventStore {
    private events: Event[] = [];

    /**
     * Append event
     */
    append(event: Event): void {
        this.events.push(event);
    }

    /**
     * Get events for aggregate
     */
    getEvents(aggregateId: string): Event[] {
        return this.events.filter(e => e.metadata?.aggregateId === aggregateId);
    }

    /**
     * Rebuild state from events
     */
    rebuildState<T>(aggregateId: string, initialState: T, reducer: (state: T, event: Event) => T): T {
        const events = this.getEvents(aggregateId);
        return events.reduce(reducer, initialState);
    }

    /**
     * Get all events
     */
    getAllEvents(): Event[] {
        return this.events;
    }
}

export const eventStore = new EventStore();

/**
 * React hook for events
 */
import { useEffect, useState } from 'react';

export function useEventListener<T = any>(
    eventType: string,
    handler: (payload: T) => void
) {
    useEffect(() => {
        const unsubscribe = eventBus.on<T>(eventType, (event) => {
            handler(event.payload);
        });

        return unsubscribe;
    }, [eventType, handler]);
}

/**
 * Event-driven notification system
 */
import React from 'react';

export function EventNotifications() {
    const [notifications, setNotifications] = useState<Event[]>([]);

    useEffect(() => {
        const unsubscribers = [
            eventBus.on(DomainEvents.MOVIE_ADDED, (event) => {
                setNotifications(prev => [...prev, event].slice(-5));
            }),
            eventBus.on(DomainEvents.SUBSCRIPTION_CREATED, (event) => {
                setNotifications(prev => [...prev, event].slice(-5));
            })
        ];

        return () => {
            unsubscribers.forEach(unsub => unsub());
        };
    }, []);

    return (
        <div className="event-notifications">
            {notifications.map(event => (
                <div key={event.id} className="notification">
                    <strong>{event.type}</strong>
                    <span>{new Date(event.timestamp).toLocaleTimeString()}</span>
                </div>
            ))}
        </div>
    );
}

const styles = `
.event-notifications {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  z-index: 1000;
}

.notification {
  padding: 1rem;
  background: rgba(102, 126, 234, 0.9);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  animation: slideIn 0.3s ease-out;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.notification strong {
  font-size: 0.9rem;
}

.notification span {
  font-size: 0.75rem;
  opacity: 0.8;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
`;
