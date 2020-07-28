import {EventsPhase} from './Phases';

export interface SharedEventProperties {
  /**
   * name of the event
   */
  name?: string;
  /**
   * event category
   */
  cat?: string;
  /**
   * tracing clock timestamp
   */
  ts?: number;
  /**
   * process ID
   */
  pid?: number;
  /**
   * thread ID
   */
  tid?: number;
  /**
   * event type (phase)
   */
  ph: EventsPhase;
  /**
   * id for a stackFrame object
   */
  sf?: number;
  /**
   * thread clock timestamp
   */
  tts?: number;
  /**
   * a fixed color name
   */
  cname?: string;
  /**
   * event arguments
   */
  args?: {[key in string]: any};
}

interface DurationEventBegin extends SharedEventProperties {
  ph: EventsPhase.DURATION_EVENTS_BEGIN;
}

interface DurationEventEnd extends SharedEventProperties {
  ph: EventsPhase.DURATION_EVENTS_END;
}

export type DurationEvent = DurationEventBegin | DurationEventEnd;

export interface CompleteEvent extends SharedEventProperties {
  ph: EventsPhase.COMPLETE_EVENTS;
  dur: number;
}

export interface MetadataEvent extends SharedEventProperties {
  ph: EventsPhase.METADATA_EVENTS;
}

export interface SampleEvent extends SharedEventProperties {
  ph: EventsPhase.SAMPLE_EVENTS;
}

interface ObjectEventCreated extends SharedEventProperties {
  ph: EventsPhase.OBJECT_EVENTS_CREATED;
  scope?: string;
}

interface ObjectEventSnapshot extends SharedEventProperties {
  ph: EventsPhase.OBJECT_EVENTS_SNAPSHOT;
  scope?: string;
}

interface ObjectEventDestroyed extends SharedEventProperties {
  ph: EventsPhase.OBJECT_EVENTS_DESTROYED;
  scope?: string;
}

export type ObjectEvent =
  | ObjectEventCreated
  | ObjectEventSnapshot
  | ObjectEventDestroyed;

export interface ClockSyncEvent extends SharedEventProperties {
  ph: EventsPhase.CLOCK_SYNC_EVENTS;
  args: {
    sync_id: string;
    issue_ts?: number;
  };
}

interface ContextEventEnter extends SharedEventProperties {
  ph: EventsPhase.CONTEXT_EVENTS_ENTER;
}

interface ContextEventLeave extends SharedEventProperties {
  ph: EventsPhase.CONTEXT_EVENTS_LEAVE;
}

export type ContextEvent = ContextEventEnter | ContextEventLeave;

interface AsyncEventStart extends SharedEventProperties {
  ph: EventsPhase.ASYNC_EVENTS_NESTABLE_START;
  id: number;
  scope?: string;
}

interface AsyncEventInstant extends SharedEventProperties {
  ph: EventsPhase.ASYNC_EVENTS_NESTABLE_INSTANT;
  id: number;
  scope?: string;
}

interface AsyncEventEnd extends SharedEventProperties {
  ph: EventsPhase.ASYNC_EVENTS_NESTABLE_END;
  id: number;
  scope?: string;
}

export type AsyncEvent = AsyncEventStart | AsyncEventInstant | AsyncEventEnd;

export interface InstantEvent extends SharedEventProperties {
  ph: EventsPhase.INSTANT_EVENTS;
  s: string;
}

export interface CounterEvent extends SharedEventProperties {
  ph: EventsPhase.COUNTER_EVENTS;
}

interface FlowEventStart extends SharedEventProperties {
  ph: EventsPhase.FLOW_EVENTS_START;
}

interface FlowEventStep extends SharedEventProperties {
  ph: EventsPhase.FLOW_EVENTS_STEP;
}
interface FlowEventEnd extends SharedEventProperties {
  ph: EventsPhase.FLOW_EVENTS_END;
}

export type FlowEvent = FlowEventStart | FlowEventStep | FlowEventEnd;

interface MemoryDumpGlobal extends SharedEventProperties {
  ph: EventsPhase.MEMORY_DUMP_EVENTS_GLOBAL;
  id: string;
}

interface MemoryDumpProcess extends SharedEventProperties {
  ph: EventsPhase.MEMORY_DUMP_EVENTS_PROCESS;
  id: string;
}
export type MemoryDumpEvent = MemoryDumpGlobal | MemoryDumpProcess;

export interface MarkEvent extends SharedEventProperties {
  ph: EventsPhase.MARK_EVENTS;
}

export interface LinkedIDEvent extends SharedEventProperties {
  ph: EventsPhase.LINKED_ID_EVENTS;
  id: number;
  args: {
    linked_id: number;
  };
}

export type Event =
  | DurationEvent
  | CompleteEvent
  | MetadataEvent
  | SampleEvent
  | ObjectEvent
  | ClockSyncEvent
  | ContextEvent
  | AsyncEvent
  | InstantEvent
  | CounterEvent
  | FlowEvent
  | MemoryDumpEvent
  | MarkEvent
  | LinkedIDEvent;

/**
 * Each item in the stackFrames object of the hermes profile
 */
export interface HermesStackFrame {
  line: string;
  column: string;
  funcLine: string;
  funcColumn: string;
  name: string;
  category: string;
  /**
   * A parent function may or may not exist
   */
  parent?: number;
}
/**
 * Each item in the samples array of the hermes profile
 */
export interface HermesSample {
  cpu: string;
  name: string;
  ts: string;
  pid: number;
  tid: string;
  weight: string;
  /**
   * Will refer to an element in the stackFrames object of the Hermes Profile
   */
  sf: number;
  stackFrameData?: HermesStackFrame;
}

/**
 * Hermes Profile Interface
 */
export interface HermesCPUProfile {
  traceEvents: SharedEventProperties[];
  samples: HermesSample[];
  stackFrames: {[key in string]: HermesStackFrame};
}

export interface CPUProfileChunk {
  id: string;
  pid: number;
  tid: string;
  startTime: number;
  nodes: CPUProfileChunkNode[];
  samples: number[];
  timeDeltas: number[];
}

export interface CPUProfileChunkNode {
  id: number;
  callFrame: {
    line: string;
    column: string;
    funcLine: string;
    funcColumn: string;
    name: string;
    url?: string;
    category: string;
  };
  parent?: number;
}

export type CPUProfileChunker = {
  nodes: CPUProfileChunkNode[];
  sampleNumbers: number[];
  timeDeltas: number[];
};

export interface SourceMap {
  version: string;
  sources: string[];
  sourceContent: string[];
  x_facebook_sources: {names: string[]; mappings: string}[] | null;
  names: string[];
  mappings: string;
}
