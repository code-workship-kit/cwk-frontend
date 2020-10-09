import { applyPolyfill } from 'custom-elements-hmr-polyfill';
import { css, html, LitElement } from 'lit-element';
import { nothing } from 'lit-html';
import './AdminSidebar.js';
import { getParticipantCookie } from './getParticipantCookie.js';
import { setCustomCSSProps } from './setCustomCSSProps.js';
import './loadAndSetDankMonoFont.js';
import './ParticipantFrontendCapsule.js';
import './ParticipantTerminalCapsule.js';
import './SelectCookie.js';

setCustomCSSProps();

class AppShell extends LitElement {
  static get styles() {
    return css`
      :host {
        display: block;
        height: 100vh;
        background-color: #fcfcfc;
      }

      .header {
        width: 100%;
        display: inline-block;
        margin-bottom: 50px;
      }

      h1 {
        margin-top: 0;
        margin-bottom: 50px;
        text-align: center;
        font-weight: lighter;
      }

      .participants-container {
        margin: 0 30px 30px 30px;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        column-gap: 40px;
        row-gap: 30px;
      }

      .change-name {
        font-family: Dank Mono, sans-serif;
        float: right;
        padding: 8px;
        margin: 15px;
        border: none;
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.4);
        border-radius: 4px;
        color: var(--cwk-color-white);
        background: linear-gradient(0.1turn, var(--cwk-color-primary), var(--cwk-color-secondary));
      }

      .current-name {
        float: right;
        padding-top: 5px;
      }

      .change-name:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        transition: all 0.15s ease;
      }

      @media (min-width: 600px) {
        .participants-container {
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
        }
      }

      @media (min-width: 1200px) {
        .participants-container {
          grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
        }
      }
    `;
  }

  static get properties() {
    return {
      title: {
        type: String,
        reflect: true,
      },
      participants: {
        attribute: false,
      },
      currentParticipantName: {
        attribute: false,
      },
      mode: {
        type: String,
        reflect: true,
      },
      target: {
        attribute: false,
      },
    };
  }

  constructor() {
    super();
    window.HMR_SKIP_DEEP_PATCH = true;
    applyPolyfill();
    this.mode = 'iframe';
    this.target = 'frontend';
    setCustomCSSProps();
    this.fetchConfigComplete = new Promise(resolve => {
      this.fetchConfigResolve = resolve;
    });
  }

  connectedCallback() {
    if (super.connectedCallback) {
      super.connectedCallback();
    }
    this.fetchWorkshopConfig();
    const participant = getParticipantCookie();
    if (participant) {
      this.currentParticipantName = participant.participant_name;
    }
  }

  async fetchWorkshopConfig() {
    const workshop = await import(this.workshopImport || 'placeholder-import.js');
    this.workshop = workshop.default;
    const { title, participants } = this.workshop;
    this.participants = participants;
    this.title = title || this.title;
    this.fetchConfigResolve();
    return this.workshop;
  }

  changeName() {
    document.cookie = 'participant_name=;path=/;max-age=0';
    document.cookie = 'cwk_auth_token=;path=/;max-age=0';
    this.currentParticipantName = null;
  }

  render() {
    return html`
      ${this.currentParticipantName
        ? html`
            <div class="header">
              <cwk-admin-sidebar .websocketPort=${this.websocketPort}></cwk-admin-sidebar>
              <button class="change-name" @click=${this.changeName}>Change your name</button>
              <p class="current-name">Hi ${this.currentParticipantName}!</p>
            </div>

            ${this.title ? html`<h1>${this.title}</h1>` : nothing}

            <div>
              <div class="participants-container">
                ${this.participants
                  ? this.participants.map(name =>
                      this.target === 'terminal'
                        ? html`<cwk-participant-terminal-capsule
                            .name="${name}"
                          ></cwk-participant-terminal-capsule>`
                        : html`<cwk-participant-frontend-capsule
                            .participantModuleImport=${this.participantModuleImport}
                            .mode=${this.mode}
                            .name="${name}"
                          ></cwk-participant-frontend-capsule>`,
                    )
                  : html``}
              </div>
            </div>
          `
        : html`<cwk-select-cookie .workshopImport=${this.workshopImport}></cwk-select-cookie>`}
    `;
  }
}
customElements.define('cwk-app-shell', AppShell);
