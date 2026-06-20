import { render, screen, fireEvent } from '@testing-library/react';
import Step3Settings from './step3-settings';
import { WizardState } from '@/app/create/page';

describe('Step3Settings Component', () => {
  const mockOnUpdate = jest.fn();
  const mockOnNext = jest.fn();
  const mockOnBack = jest.fn();

  const defaultState: WizardState = {
    thumbnailFile: null,
    thumbnailPreview: null,
    backgroundFile: null,
    backgroundPreview: null,
    audioFile: null,
    audioUrl: null,
    rawLyrics: '',
    tapLines: [],
    tapCurrentLineIndex: 0,
    manualInputs: [],
    syncTab: 'tap',
    lyrics: [],
    settings: {
      resolution: '1920x1080',
      fontName: 'Arial',
      fontSize: 48,
      highlightColor: '#10b981',
      outlineEnabled: true,
      introDurationSec: 5,
    },
    jobId: null,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<Step3Settings state={defaultState} onUpdate={mockOnUpdate} onNext={mockOnNext} onBack={mockOnBack} />);
    expect(screen.getByText('Video Settings')).toBeInTheDocument();
  });

  it('calls onUpdate when resolution is changed', () => {
    render(<Step3Settings state={defaultState} onUpdate={mockOnUpdate} onNext={mockOnNext} onBack={mockOnBack} />);
    
    const resolutionSelect = screen.getByLabelText(/Video Resolution/i);
    fireEvent.change(resolutionSelect, { target: { value: '1280x720' } });
    
    expect(mockOnUpdate).toHaveBeenCalledWith({
      settings: expect.objectContaining({ resolution: '1280x720' })
    });
  });

  it('calls onUpdate when font size is changed', () => {
    render(<Step3Settings state={defaultState} onUpdate={mockOnUpdate} onNext={mockOnNext} onBack={mockOnBack} />);
    
    const fontSizeSlider = screen.getByLabelText(/Font Size/i);
    fireEvent.change(fontSizeSlider, { target: { value: '60' } });
    
    expect(mockOnUpdate).toHaveBeenCalledWith({
      settings: expect.objectContaining({ fontSize: 60 })
    });
  });

  it('calls onUpdate when highlight color is changed via swatches', () => {
    render(<Step3Settings state={defaultState} onUpdate={mockOnUpdate} onNext={mockOnNext} onBack={mockOnBack} />);
    
    const purpleSwatch = screen.getByTitle('Purple');
    fireEvent.click(purpleSwatch);
    
    expect(mockOnUpdate).toHaveBeenCalledWith({
      settings: expect.objectContaining({ highlightColor: '#a855f7' })
    });
  });

  it('toggles outline when the outline button is clicked', () => {
    render(<Step3Settings state={defaultState} onUpdate={mockOnUpdate} onNext={mockOnNext} onBack={mockOnBack} />);
    
    const outlineButton = screen.getByRole('button', { name: /ON/i });
    fireEvent.click(outlineButton);
    
    expect(mockOnUpdate).toHaveBeenCalledWith({
      settings: expect.objectContaining({ outlineEnabled: false })
    });
  });

  it('calls onNext and onBack correctly', () => {
    render(<Step3Settings state={defaultState} onUpdate={mockOnUpdate} onNext={mockOnNext} onBack={mockOnBack} />);
    
    fireEvent.click(screen.getByRole('button', { name: /Back/i }));
    expect(mockOnBack).toHaveBeenCalledTimes(1);
    
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    expect(mockOnNext).toHaveBeenCalledTimes(1);
  });
});
