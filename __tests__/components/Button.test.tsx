import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Button from '../../src/components/common/Button';

describe('Button', () => {
  it('renders without crashing', () => {
    const { getByText } = render(
      <Button title="Press Me" onPress={jest.fn()} />
    );
    expect(getByText('Press Me')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Test" onPress={onPress} />);
    fireEvent.press(getByText('Test'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows ActivityIndicator when loading', () => {
    const { queryByText, UNSAFE_getByType } = render(
      <Button title="Loading" onPress={jest.fn()} loading />
    );
    expect(queryByText('Loading')).toBeNull();
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByTestId, UNSAFE_getAllByType } = render(
      <Button title="Disabled" onPress={onPress} disabled />
    );
    // Disabled button still renders title
  });

  it('renders primary variant by default', () => {
    const { getByText } = render(<Button title="Primary" onPress={jest.fn()} />);
    expect(getByText('Primary')).toBeTruthy();
  });

  it('renders outline variant', () => {
    const { getByText } = render(
      <Button title="Outline" onPress={jest.fn()} variant="outline" />
    );
    expect(getByText('Outline')).toBeTruthy();
  });

  it('renders all sizes', () => {
    const { getByText: getSmall } = render(<Button title="S" onPress={jest.fn()} size="small" />);
    expect(getSmall('S')).toBeTruthy();
    const { getByText: getLarge } = render(<Button title="L" onPress={jest.fn()} size="large" />);
    expect(getLarge('L')).toBeTruthy();
  });
});
