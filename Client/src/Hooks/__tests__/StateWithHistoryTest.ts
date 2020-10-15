import { renderHook, act } from '@testing-library/react-hooks';
import { useStateWithHistory } from '../StateWithHistory';

describe('useStateWithHistory', () => {

  it('should work with size = 1', () => {
    const { result } = renderHook(() => useStateWithHistory('foo', { size: 1 }));
    expect(result.current.state).toBe('foo');
    expect(result.current.canRedo).toBeFalsy();
    expect(result.current.canUndo).toBeFalsy();
    act(() => {
      result.current.set('bar');
    })
    expect(result.current.state).toBe('bar');
  });

  it('should work with size > 1', () => {
    const { result } = renderHook(() => useStateWithHistory('a', { size: 5 }));
    expect(result.current.state).toBe('a');
    act(() => {
      result.current.set('b');
      result.current.set('c');
      result.current.set('d');
      result.current.set('e');
      result.current.set('f');
    });
    expect(result.current.state).toBe('f');
    expect(result.current.canUndo).toBeTruthy();
    expect(result.current.canRedo).toBeFalsy();
    act(() => {
      result.current.undo();
      result.current.undo();
      result.current.undo();
      result.current.undo();
      result.current.undo();
      result.current.undo();
    });
    expect(result.current.state).toBe('b');
    expect(result.current.canUndo).toBeFalsy();
    expect(result.current.canRedo).toBeTruthy();
    act(() => {
      result.current.redo();
    });
    expect(result.current.state).toBe('c');
    expect(result.current.canUndo).toBeTruthy();
    expect(result.current.canRedo).toBeTruthy();
  });

  it('should allow functional state updates', () => {
    const { result } = renderHook(() => useStateWithHistory(1, { size: 2 }));
    act(() => {
      result.current.set(n => n * 3);
    });
    expect(result.current.state).toBe(3);
    act(() => {
      result.current.set(n => n * 3);
    });
    expect(result.current.state).toBe(9);
  });

  it('should allow to initialize with undefined', () => {
    const { result } = renderHook(() => useStateWithHistory<number>({ size: 2 }));
    expect(result.current.state).toBeUndefined();
    act(() => {
      result.current.set(1);
      result.current.set(2);
    });
    expect(result.current.state).toBe(2);
  })
})