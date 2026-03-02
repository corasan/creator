import { describe, expect, it } from 'bun:test'
import { parseAgentLines } from '../lib/parseAgentLines.js'

describe('parseAgentLines', () => {
  it('emits a plan event from a valid PLAN: line', () => {
    const { events, planEmitted } = parseAgentLines(
      ['PLAN:{"tasks":[{"id":"t1","label":"Install packages"}]}'],
      false,
    )
    expect(events).toHaveLength(1)
    expect(events[0]).toEqual({
      type: 'plan',
      tasks: [{ id: 't1', label: 'Install packages', status: 'pending' }],
    })
    expect(planEmitted).toBe(true)
  })

  it('ignores a second PLAN: line when planEmitted is true', () => {
    const { events } = parseAgentLines(
      ['PLAN:{"tasks":[{"id":"t2","label":"Other"}]}'],
      true,
    )
    expect(events).toHaveLength(0)
  })

  it('emits progress/running for TASK_START:', () => {
    const { events } = parseAgentLines(['TASK_START:t1'], false)
    expect(events).toHaveLength(1)
    expect(events[0]).toEqual({ type: 'progress', taskId: 't1', status: 'running' })
  })

  it('emits progress/done for TASK_DONE:', () => {
    const { events } = parseAgentLines(['TASK_DONE:t1'], false)
    expect(events[0]).toEqual({ type: 'progress', taskId: 't1', status: 'done' })
  })

  it('emits progress/error with message for TASK_ERROR:id:msg', () => {
    const { events } = parseAgentLines(['TASK_ERROR:t1:something broke'], false)
    expect(events[0]).toEqual({
      type: 'progress',
      taskId: 't1',
      status: 'error',
      error: 'something broke',
    })
  })

  it('emits progress/error with Unknown error when no message after id', () => {
    const { events } = parseAgentLines(['TASK_ERROR:t1'], false)
    expect(events[0]).toEqual({
      type: 'progress',
      taskId: 't1',
      status: 'error',
      error: 'Unknown error',
    })
  })

  it('silently ignores malformed PLAN: JSON', () => {
    const { events, planEmitted } = parseAgentLines(['PLAN:{bad json'], false)
    expect(events).toHaveLength(0)
    expect(planEmitted).toBe(false)
  })

  it('produces no events for empty lines', () => {
    const { events } = parseAgentLines(['', '   ', '\t'], false)
    expect(events).toHaveLength(0)
  })

  it('emits multiple events from a batch of lines in order', () => {
    const { events } = parseAgentLines(
      [
        'PLAN:{"tasks":[{"id":"t1","label":"A"},{"id":"t2","label":"B"}]}',
        'TASK_START:t1',
        'TASK_DONE:t1',
        'TASK_START:t2',
      ],
      false,
    )
    expect(events).toHaveLength(4)
    expect(events[0].type).toBe('plan')
    expect(events[1]).toEqual({ type: 'progress', taskId: 't1', status: 'running' })
    expect(events[2]).toEqual({ type: 'progress', taskId: 't1', status: 'done' })
    expect(events[3]).toEqual({ type: 'progress', taskId: 't2', status: 'running' })
  })
})
