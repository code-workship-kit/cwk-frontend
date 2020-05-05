import { html, LitElement } from 'lit-element';
// Placeholder here, will transform this to resolve to the workshop.js
// in the rootDir folder. This is a user-provided file
// eslint-disable-next-line import/no-unresolved
import { workshop } from './workshopImport.js';

const setCookie = e => {
  document.cookie = `participant_name=${e.target.innerText};path=/`;
  window.location.reload();
};

class SelectCookie extends LitElement {
  static get properties() {
    return {
      participants: {
        type: Array,
      },
    };
  }

  connectedCallback() {
    super.connectedCallback();
    this.fetchNames();
  }

  async fetchNames() {
    const { participants } = workshop;
    this.participants = participants;
  }

  render() {
    return html`
      ${this.participants.map(name => html`<button @click=${setCookie}>${name}</button>`)}
    `;
  }
}
customElements.define('cwk-select-cookie', SelectCookie);
