/**
 * SacredTabBar — render + interaction tests.
 *
 * Verifies the 4-tab pill bar renders every Kiaanverse tab with its
 * Devanagari + English label, marks the active tab, and invokes
 * `onChange` when a different tab is pressed.
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { SacredTabBar } from '../components/sacred-reflections/SacredTabBar';
import {
  SACRED_TABS,
  type SacredTab,
} from '../components/sacred-reflections/constants';

describe('SacredTabBar', () => {
  it('renders every tab with Devanagari + SMALLCAPS labels', () => {
    const { getByText } = render(
      <SacredTabBar active="editor" onChange={() => undefined} />,
    );
    for (const tab of SACRED_TABS) {
      expect(getByText(tab.sanskrit)).toBeTruthy();
      expect(getByText(tab.label)).toBeTruthy();
    }
  });

  it('marks the active tab via accessibilityState.selected=true', () => {
    const { getByLabelText } = render(
      <SacredTabBar active="kiaan" onChange={() => undefined} />,
    );
    const kiaanTab = getByLabelText('KIAAN tab');
    expect(kiaanTab.props.accessibilityState).toEqual(
      expect.objectContaining({ selected: true }),
    );
    const editorTab = getByLabelText('EDITOR tab');
    expect(editorTab.props.accessibilityState).toEqual(
      expect.objectContaining({ selected: false }),
    );
  });

  it('invokes onChange with the new tab id when a different tab is pressed', () => {
    const onChange = jest.fn();
    const { getByLabelText } = render(
      <SacredTabBar active="editor" onChange={onChange} />,
    );
    fireEvent.press(getByLabelText('BROWSE tab'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith<[SacredTab]>('browse');
  });

  it('does NOT invoke onChange when the already-active tab is pressed', () => {
    const onChange = jest.fn();
    const { getByLabelText } = render(
      <SacredTabBar active="calendar" onChange={onChange} />,
    );
    fireEvent.press(getByLabelText('CALENDAR tab'));
    expect(onChange).not.toHaveBeenCalled();
  });
});
