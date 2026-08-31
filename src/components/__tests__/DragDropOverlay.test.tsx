import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { DragDropOverlay } from '../DragDropOverlay';

describe('DragDropOverlay Component', () => {
  it('does not render overlay initially when not dragging', () => {
    const onFileLoaded = vi.fn();
    render(<DragDropOverlay onFileLoaded={onFileLoaded} activeReportName="report-1.sarif" />);

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders overlay when files are dragged into window and dismisses on dragleave', () => {
    const onFileLoaded = vi.fn();
    render(<DragDropOverlay onFileLoaded={onFileLoaded} activeReportName="report-1.sarif" />);

    // Simulate dragenter with Files type
    act(() => {
      window.dispatchEvent(
        new Event('dragenter', {
          bubbles: true,
          cancelable: true,
        })
      );
    });

    const dragEnterEvent = new Event('dragenter', { bubbles: true, cancelable: true });
    Object.defineProperty(dragEnterEvent, 'dataTransfer', {
      value: {
        types: ['Files'],
      },
    });

    act(() => {
      window.dispatchEvent(dragEnterEvent);
    });

    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText(/report-1\.sarif/i)).toBeDefined();

    // Simulate dragleave
    const dragLeaveEvent = new Event('dragleave', { bubbles: true, cancelable: true });
    act(() => {
      window.dispatchEvent(dragLeaveEvent);
    });

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('calls onFileLoaded when file is dropped onto overlay', async () => {
    const onFileLoaded = vi.fn();
    render(<DragDropOverlay onFileLoaded={onFileLoaded} activeReportName="old-report.sarif" />);

    // Trigger dragenter to show overlay
    const dragEnterEvent = new Event('dragenter', { bubbles: true, cancelable: true });
    Object.defineProperty(dragEnterEvent, 'dataTransfer', {
      value: { types: ['Files'] },
    });
    act(() => {
      window.dispatchEvent(dragEnterEvent);
    });

    expect(screen.getByRole('dialog')).toBeDefined();

    // Create a mock file
    const sampleContent = JSON.stringify({ version: '2.1.0', runs: [] });
    const mockFile = new File([sampleContent], 'new-report.sarif', { type: 'application/json' });

    const dropEvent = new Event('drop', { bubbles: true, cancelable: true });
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: { files: [mockFile] },
    });

    await act(async () => {
      window.dispatchEvent(dropEvent);
    });

    expect(onFileLoaded).toHaveBeenCalledWith(sampleContent, 'new-report.sarif');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('dismisses overlay when Escape key is pressed', () => {
    const onFileLoaded = vi.fn();
    render(<DragDropOverlay onFileLoaded={onFileLoaded} activeReportName="report.sarif" />);

    const dragEnterEvent = new Event('dragenter', { bubbles: true, cancelable: true });
    Object.defineProperty(dragEnterEvent, 'dataTransfer', {
      value: { types: ['Files'] },
    });
    act(() => {
      window.dispatchEvent(dragEnterEvent);
    });

    expect(screen.getByRole('dialog')).toBeDefined();

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('dismisses overlay when close button is clicked', () => {
    const onFileLoaded = vi.fn();
    render(<DragDropOverlay onFileLoaded={onFileLoaded} activeReportName="report.sarif" />);

    const dragEnterEvent = new Event('dragenter', { bubbles: true, cancelable: true });
    Object.defineProperty(dragEnterEvent, 'dataTransfer', {
      value: { types: ['Files'] },
    });
    act(() => {
      window.dispatchEvent(dragEnterEvent);
    });

    const closeBtn = screen.getByTitle(/dismiss drop overlay/i);
    fireEvent.click(closeBtn);

    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
