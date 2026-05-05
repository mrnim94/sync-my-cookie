import React, { Component, createRef } from 'react';

interface Prop {
  max: number;
  min?: number;
  className?: string;
  children: React.ReactNode;
}

interface State {
  fontSize: number;
}

/**
 * Lightweight drop-in replacement for `react-textfit` (single-line mode).
 *
 * `react-textfit@1.1.1` is unmaintained (last release 2018) and declares
 * peer deps `react@^15.0.0 || ^16.0.0`, which is why yarn keeps emitting
 * peer warnings against React 18. It also relies on legacy `findDOMNode`
 * APIs that React is removing.
 *
 * This component uses `ResizeObserver` + a small binary search to shrink
 * the font size until the inner text fits the parent's width on a single
 * line. Behavior matches how the app used `<Textfit max={40}>{domain}</Textfit>`.
 */
class TextFit extends Component<Prop, State> {
  private wrapperRef = createRef<HTMLDivElement>();
  private innerRef = createRef<HTMLSpanElement>();
  private observer: ResizeObserver | null = null;

  public state: State = {
    fontSize: this.props.max,
  };

  public componentDidMount() {
    this.fit();
    if (typeof ResizeObserver !== 'undefined' && this.wrapperRef.current) {
      this.observer = new ResizeObserver(() => this.fit());
      this.observer.observe(this.wrapperRef.current);
    }
  }

  public componentDidUpdate(prevProps: Prop) {
    if (prevProps.children !== this.props.children || prevProps.max !== this.props.max) {
      this.fit();
    }
  }

  public componentWillUnmount() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  private fit = () => {
    const wrapper = this.wrapperRef.current;
    const inner = this.innerRef.current;
    if (!wrapper || !inner) {
      return;
    }
    const max = this.props.max;
    const min = this.props.min ?? 4;
    const targetWidth = wrapper.clientWidth;
    if (targetWidth <= 0) {
      return;
    }
    // Binary search the largest font-size (in px) that keeps the text
    // within `targetWidth`. We mutate the element's inline font-size
    // directly during the search to read scrollWidth at each step.
    let lo = min;
    let hi = max;
    let best = min;
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      inner.style.fontSize = `${mid}px`;
      if (inner.scrollWidth <= targetWidth) {
        best = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    if (this.state.fontSize !== best) {
      this.setState({ fontSize: best });
    } else {
      // Reset inline style so React can drive font-size through state
      // on the next render.
      inner.style.fontSize = `${best}px`;
    }
  };

  public render() {
    return (
      <div ref={this.wrapperRef} className={this.props.className}>
        <span
          ref={this.innerRef}
          style={{
            fontSize: `${this.state.fontSize}px`,
            display: 'inline-block',
            whiteSpace: 'nowrap',
          }}
        >
          {this.props.children}
        </span>
      </div>
    );
  }
}

export default TextFit;
