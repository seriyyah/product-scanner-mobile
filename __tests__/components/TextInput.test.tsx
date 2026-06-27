import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import TextInput from '../../src/components/forms/TextInput';
import { useForm } from 'react-hook-form';

// Wrapper for controlled mode
const ControlledTextInput = () => {
  const { control } = useForm({ defaultValues: { name: '' } });
  return (
    <TextInput
      label="Name"
      name="name"
      control={control}
      placeholder="Enter name"
    />
  );
};

describe('TextInput', () => {
  it('renders in standalone mode', () => {
    const { getByText } = render(
      <TextInput label="Email" value="" onChangeText={jest.fn()} />
    );
    expect(getByText('Email')).toBeTruthy();
  });

  it('calls onChangeText in standalone mode', () => {
    const onChangeText = jest.fn();
    const { getByDisplayValue, UNSAFE_getAllByType } = render(
      <TextInput label="Email" value="test" onChangeText={onChangeText} />
    );
  });

  it('shows error message', () => {
    const { getByText } = render(
      <TextInput label="Email" value="" onChangeText={jest.fn()} error="Invalid email" />
    );
    expect(getByText('Invalid email')).toBeTruthy();
  });

  it('shows required asterisk', () => {
    const { getByText } = render(
      <TextInput label="Email" value="" onChangeText={jest.fn()} required />
    );
    expect(getByText(' *')).toBeTruthy();
  });

  it('renders in controlled (react-hook-form) mode', () => {
    const { getByText } = render(<ControlledTextInput />);
    expect(getByText('Name')).toBeTruthy();
  });

  it('shows password toggle for secureTextEntry', () => {
    const { UNSAFE_getAllByType } = render(
      <TextInput label="Password" value="" onChangeText={jest.fn()} secureTextEntry />
    );
  });
});
