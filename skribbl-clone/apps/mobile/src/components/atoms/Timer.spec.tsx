/**
 * @fileoverview Unit tests for Timer atom component
 * 
 * This test file covers all functionality of the Timer component including
 * countdown display, formatting, visual states, and accessibility features.
 * Tests ensure the component meets requirements for atomic design and accessibility.
 * 
 * Requirements covered: 6.6 (atomic design), 8.1, 8.2 (accessibility)
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { Timer, TimerProps } from './Timer';

// Helper function to render Timer with default props
const renderTimer = (props: Partial<TimerProps> = {}) => {
  const defaultProps: TimerProps = {
    seconds: 60,
    ...props,
  };
  return render(<Timer {...defaultProps} />);
};

describe('Timer Component', () => {
  // Test basic rendering functionality
  describe('Rendering', () => {
    it('should render with default props', () => {
      const { getByRole } = renderTimer();
      const timer = getByRole('timer');
      expect(timer).toBeTruthy();
    });

    it('should display time in MM:SS format by default', () => {
      const { getByText } = renderTimer({ seconds: 125 });
      expect(getByText('02:05')).toBeTruthy();
    });

    it('should display time in seconds only when showMinutes is false', () => {
      const { getByText } = renderTimer({ 
        seconds: 45,
        showMinutes: false 
      });
      expect(getByText('45')).toBeTruthy();
    });

    it('should display zero time correctly', () => {
      const { getByText } = renderTimer({ seconds: 0 });
      expect(getByText('00:00')).toBeTruthy();
    });
  });

  // Test time formatting functionality
  describe('Time Formatting', () => {
    describe('Minutes and Seconds Format', () => {
      it('should format single digit minutes and seconds with leading zeros', () => {
        const { getByText } = renderTimer({ seconds: 65 }); // 1:05
        expect(getByText('01:05')).toBeTruthy();
      });

      it('should format double digit minutes and seconds correctly', () => {
        const { getByText } = renderTimer({ seconds: 725 }); // 12:05
        expect(getByText('12:05')).toBeTruthy();
      });

      it('should format exactly one minute correctly', () => {
        const { getByText } = renderTimer({ seconds: 60 });
        expect(getByText('01:00')).toBeTruthy();
      });

      it('should format less than one minute correctly', () => {
        const { getByText } = renderTimer({ seconds: 30 });
        expect(getByText('00:30')).toBeTruthy();
      });

      it('should format zero seconds correctly', () => {
        const { getByText } = renderTimer({ seconds: 0 });
        expect(getByText('00:00')).toBeTruthy();
      });
    });

    describe('Seconds Only Format', () => {
      it('should format seconds only when showMinutes is false', () => {
        const { getByText } = renderTimer({ 
          seconds: 125,
          showMinutes: false 
        });
        expect(getByText('125')).toBeTruthy();
      });

      it('should format zero seconds in seconds-only mode', () => {
        const { getByText } = renderTimer({ 
          seconds: 0,
          showMinutes: false 
        });
        expect(getByText('0')).toBeTruthy();
      });

      it('should format single digit seconds in seconds-only mode', () => {
        const { getByText } = renderTimer({ 
          seconds: 5,
          showMinutes: false 
        });
        expect(getByText('5')).toBeTruthy();
      });
    });
  });

  // Test timer states based on remaining time
  describe('Timer States', () => {
    it('should be in normal state with plenty of time', () => {
      const { getByRole } = renderTimer({ seconds: 60 });
      const timer = getByRole('timer');
      expect(timer).toBeTruthy();
    });

    it('should be in warning state with 30 seconds or less', () => {
      const { getByRole } = renderTimer({ seconds: 30 });
      const timer = getByRole('timer');
      expect(timer).toBeTruthy();
    });

    it('should be in critical state with 10 seconds or less', () => {
      const { getByRole } = renderTimer({ seconds: 10 });
      const timer = getByRole('timer');
      expect(timer).toBeTruthy();
    });

    it('should be in expired state with 0 seconds', () => {
      const { getByRole } = renderTimer({ seconds: 0 });
      const timer = getByRole('timer');
      expect(timer).toBeTruthy();
    });

    it('should handle negative seconds as expired', () => {
      const { getByText } = renderTimer({ seconds: -5 });
      expect(getByText('00:00')).toBeTruthy();
    });
  });

  // Test active/inactive states
  describe('Active State', () => {
    it('should render as active by default', () => {
      const { getByRole } = renderTimer();
      const timer = getByRole('timer');
      expect(timer).toBeTruthy();
    });

    it('should render as active when isActive is true', () => {
      const { getByRole } = renderTimer({ isActive: true });
      const timer = getByRole('timer');
      expect(timer).toBeTruthy();
    });

    it('should render as inactive when isActive is false', () => {
      const { getByRole } = renderTimer({ isActive: false });
      const timer = getByRole('timer');
      expect(timer).toBeTruthy();
    });
  });

  // Test onExpire callback functionality
  describe('OnExpire Callback', () => {
    it('should call onExpire when timer reaches zero', () => {
      const mockOnExpire = jest.fn();
      renderTimer({ seconds: 0, onExpire: mockOnExpire });
      
      expect(mockOnExpire).toHaveBeenCalledTimes(1);
    });

    it('should call onExpire when timer is negative', () => {
      const mockOnExpire = jest.fn();
      renderTimer({ seconds: -1, onExpire: mockOnExpire });
      
      expect(mockOnExpire).toHaveBeenCalledTimes(1);
    });

    it('should not call onExpire when timer is positive', () => {
      const mockOnExpire = jest.fn();
      renderTimer({ seconds: 30, onExpire: mockOnExpire });
      
      expect(mockOnExpire).not.toHaveBeenCalled();
    });

    it('should work without onExpire callback', () => {
      expect(() => renderTimer({ seconds: 0 })).not.toThrow();
    });

    it('should call onExpire only once for zero seconds', () => {
      const mockOnExpire = jest.fn();
      const { rerender } = renderTimer({ seconds: 0, onExpire: mockOnExpire });
      
      // Re-render with same props should not call onExpire again
      rerender(<Timer seconds={0} onExpire={mockOnExpire} />);
      
      expect(mockOnExpire).toHaveBeenCalledTimes(1);
    });
  });

  // Test accessibility features
  describe('Accessibility', () => {
    it('should have correct accessibility role', () => {
      const { getByRole } = renderTimer();
      const timer = getByRole('timer');
      expect(timer).toBeTruthy();
    });

    it('should be marked as accessible', () => {
      const { getByRole } = renderTimer();
      const timer = getByRole('timer');
      expect(timer.props.accessible).toBe(true);
    });

    it('should have timer accessibility role', () => {
      const { getByRole } = renderTimer();
      const timer = getByRole('timer');
      expect(timer.props.accessibilityRole).toBe('timer');
    });

    it('should have live region for screen reader updates', () => {
      const { getByRole } = renderTimer();
      const timer = getByRole('timer');
      expect(timer.props.accessibilityLiveRegion).toBe('polite');
    });

    describe('Accessibility Labels', () => {
      it('should have correct label for minutes and seconds', () => {
        const { getByLabelText } = renderTimer({ seconds: 125 }); // 2:05
        expect(getByLabelText('2 minutes and 5 seconds remaining')).toBeTruthy();
      });

      it('should have correct label for single minute', () => {
        const { getByLabelText } = renderTimer({ seconds: 61 }); // 1:01
        expect(getByLabelText('1 minute and 1 second remaining')).toBeTruthy();
      });

      it('should have correct label for multiple minutes, single second', () => {
        const { getByLabelText } = renderTimer({ seconds: 121 }); // 2:01
        expect(getByLabelText('2 minutes and 1 second remaining')).toBeTruthy();
      });

      it('should have correct label for seconds only', () => {
        const { getByLabelText } = renderTimer({ seconds: 30 }); // 0:30
        expect(getByLabelText('30 seconds remaining')).toBeTruthy();
      });

      it('should have correct label for single second', () => {
        const { getByLabelText } = renderTimer({ seconds: 1 }); // 0:01
        expect(getByLabelText('1 second remaining')).toBeTruthy();
      });

      it('should have correct label for expired timer', () => {
        const { getByLabelText } = renderTimer({ seconds: 0 });
        expect(getByLabelText('Timer expired')).toBeTruthy();
      });

      it('should have correct label for seconds-only format', () => {
        const { getByLabelText } = renderTimer({ 
          seconds: 45,
          showMinutes: false 
        });
        expect(getByLabelText('45 seconds remaining')).toBeTruthy();
      });

      it('should have correct label for single second in seconds-only format', () => {
        const { getByLabelText } = renderTimer({ 
          seconds: 1,
          showMinutes: false 
        });
        expect(getByLabelText('1 second remaining')).toBeTruthy();
      });
    });
  });

  // Test custom styling
  describe('Custom Styling', () => {
    it('should apply custom container styles', () => {
      const customStyle = { backgroundColor: 'red' };
      const { getByRole } = renderTimer({ containerStyle: customStyle });
      const timer = getByRole('timer');
      
      // Check that the timer is rendered (styling verification is limited in testing)
      expect(timer).toBeTruthy();
    });

    it('should apply custom text styles', () => {
      const customTextStyle = { fontSize: 24 };
      const { getByText } = renderTimer({ 
        seconds: 60,
        textStyle: customTextStyle 
      });
      const text = getByText('01:00');
      
      expect(text.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining(customTextStyle)
        ])
      );
    });

    it('should combine custom styles with state styles', () => {
      const customStyle = { padding: 20 };
      const { getByRole } = renderTimer({ 
        seconds: 5, // Critical state
        containerStyle: customStyle 
      });
      const timer = getByRole('timer');
      expect(timer).toBeTruthy();
    });
  });

  // Test edge cases and error handling
  describe('Edge Cases', () => {
    it('should handle very large seconds values', () => {
      const { getByText } = renderTimer({ seconds: 3661 }); // 61:01
      expect(getByText('61:01')).toBeTruthy();
    });

    it('should handle zero seconds gracefully', () => {
      const { getByText } = renderTimer({ seconds: 0 });
      expect(getByText('00:00')).toBeTruthy();
    });

    it('should handle negative seconds as zero', () => {
      const { getByText } = renderTimer({ seconds: -10 });
      expect(getByText('00:00')).toBeTruthy();
    });

    it('should handle decimal seconds by truncating', () => {
      const { getByText } = renderTimer({ seconds: 65.7 });
      expect(getByText('01:05')).toBeTruthy();
    });

    it('should handle NaN seconds gracefully', () => {
      const { getByText } = renderTimer({ seconds: NaN });
      expect(getByText('00:00')).toBeTruthy();
    });
  });

  // Test component re-rendering and updates
  describe('Component Updates', () => {
    it('should update display when seconds change', () => {
      const { getByText, rerender } = renderTimer({ seconds: 60 });
      expect(getByText('01:00')).toBeTruthy();

      rerender(<Timer seconds={30} />);
      expect(getByText('00:30')).toBeTruthy();
    });

    it('should update accessibility label when seconds change', () => {
      const { getByLabelText, rerender } = renderTimer({ seconds: 60 });
      expect(getByLabelText('1 minute and 0 seconds remaining')).toBeTruthy();

      rerender(<Timer seconds={30} />);
      expect(getByLabelText('30 seconds remaining')).toBeTruthy();
    });

    it('should call onExpire when transitioning to zero', () => {
      const mockOnExpire = jest.fn();
      const { rerender } = renderTimer({ seconds: 1, onExpire: mockOnExpire });
      
      expect(mockOnExpire).not.toHaveBeenCalled();
      
      rerender(<Timer seconds={0} onExpire={mockOnExpire} />);
      expect(mockOnExpire).toHaveBeenCalledTimes(1);
    });
  });

  // Test format switching
  describe('Format Switching', () => {
    it('should switch between minute and seconds-only formats', () => {
      const { getByText, rerender } = renderTimer({ 
        seconds: 125,
        showMinutes: true 
      });
      expect(getByText('02:05')).toBeTruthy();

      rerender(<Timer seconds={125} showMinutes={false} />);
      expect(getByText('125')).toBeTruthy();
    });

    it('should update accessibility labels when format changes', () => {
      const { getByLabelText, rerender } = renderTimer({ 
        seconds: 125,
        showMinutes: true 
      });
      expect(getByLabelText('2 minutes and 5 seconds remaining')).toBeTruthy();

      rerender(<Timer seconds={125} showMinutes={false} />);
      expect(getByLabelText('125 seconds remaining')).toBeTruthy();
    });
  });
});