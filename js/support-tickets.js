/* ==========================================================================
   NEW DESGIN — CUSTOMER SUPPORT TICKET SYSTEM
   Inspired by Refrence-noedit/support.js, tailored for New Desgin.
   Provides ticket creation, my tickets list, ticket search, and real-time chat.
   ========================================================================== */

(function () {
  'use strict';

  const TICKETS_REF = 'supportTickets';

  function getVisitorId() {
    let id = localStorage.getItem('nd_support_visitor_id');
    if (!id) {
      id = 'vis_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
      localStorage.setItem('nd_support_visitor_id', id);
    }
    return id;
  }

  function generateTicketId() {
    return 'TKT-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();
  }

  const SupportSystem = {
    activeTicketKey: null,
    activeTicketData: null,

    init() {
      this.bindEvents();
      this.autoFillFromProfile();
      this.loadMyTickets();
    },

    autoFillFromProfile() {
      try {
        let profileData = null;
        if (typeof ProfileManager !== "undefined" && ProfileManager.getProfile) {
          profileData = ProfileManager.getProfile();
        } else {
          const raw = localStorage.getItem("nd_user_profile");
          if (raw) profileData = JSON.parse(raw);
        }

        const authUser = (typeof AuthManager !== "undefined" && AuthManager.currentUser) ? AuthManager.currentUser : null;
        const nameInput = document.getElementById("ticketName");
        const contactInput = document.getElementById("ticketContact");

        if (nameInput && !nameInput.value) {
          const nameVal = (profileData && profileData.fullName) ? profileData.fullName : (authUser ? (authUser.displayName || "") : "");
          if (nameVal) nameInput.value = nameVal;
        }

        if (contactInput && !contactInput.value) {
          const contactVal = (profileData && (profileData.phone || profileData.email)) 
            ? (profileData.phone || profileData.email) 
            : (authUser ? (authUser.email || "") : "");
          if (contactVal) contactInput.value = contactVal;
        }
      } catch (e) {
        console.warn("Support auto-fill notice:", e);
      }
    },

    bindEvents() {
      // Tab switcher
      const tabBtns = document.querySelectorAll(".support-nav-tab");
      tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
          const view = btn.getAttribute("data-view");
          this.switchView(view);
        });
      });

      // Submit ticket form
      const form = document.getElementById("supportTicketForm");
      if (form) {
        form.addEventListener("submit", (e) => {
          e.preventDefault();
          this.submitTicket();
        });
      }

      // Track by ID form
      const trackForm = document.getElementById("trackTicketForm");
      if (trackForm) {
        trackForm.addEventListener("submit", (e) => {
          e.preventDefault();
          this.trackTicketById();
        });
      }
    },

    switchView(viewId) {
      document.querySelectorAll(".support-nav-tab").forEach(btn => {
        btn.classList.toggle("active", btn.getAttribute("data-view") === viewId);
      });
      document.querySelectorAll(".support-view-pane").forEach(pane => {
        pane.classList.toggle("active", pane.id === `view-${viewId}`);
      });

      if (viewId === "new-ticket") {
        this.autoFillFromProfile();
      } else if (viewId === "my-tickets") {
        this.loadMyTickets();
      }
    },

    submitTicket() {
      const name = document.getElementById("ticketName").value.trim();
      const contact = document.getElementById("ticketContact").value.trim();
      const category = document.getElementById("ticketCategory").value;
      const subject = document.getElementById("ticketSubject").value.trim();
      const message = document.getElementById("ticketMessage").value.trim();

      if (!name || !contact || !subject || !message) {
        this.notify("Please fill in all required fields.", "error");
        return;
      }

      // Update user profile in local storage and DB with contact info
      try {
        const updateData = { fullName: name };
        if (contact.includes("@")) {
          updateData.email = contact;
        } else {
          updateData.phone = contact;
        }

        if (typeof ProfileManager !== "undefined" && ProfileManager.updateUserProfile) {
          ProfileManager.updateUserProfile(updateData);
        } else {
          const raw = localStorage.getItem("nd_user_profile");
          const p = raw ? JSON.parse(raw) : {};
          Object.assign(p, updateData);
          localStorage.setItem("nd_user_profile", JSON.stringify(p));
        }
      } catch (e) {
        console.warn("Support profile update notice:", e);
      }

      if (typeof firebase === "undefined" || !firebase.database) {
        this.notify("Database connection unavailable. Please check back shortly.", "error");
        return;
      }

      const submitBtn = document.getElementById("ticketSubmitBtn");
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Submitting Ticket...";
      }

      const ticketId = generateTicketId();
      const visitorId = getVisitorId();

      const ticketData = {
        ticketId: ticketId,
        visitorId: visitorId,
        name: name,
        contact: contact,
        category: category,
        subject: subject,
        message: message,
        status: "open",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [{
          sender: "customer",
          name: name,
          text: message,
          timestamp: Date.now()
        }]
      };

      firebase.database().ref(TICKETS_REF).push(ticketData)
        .then(ref => {
          this.notify(`Ticket submitted! ID: ${ticketId}`, "success");
          document.getElementById("supportTicketForm").reset();
          this.switchView("my-tickets");
          this.loadMyTickets();
        })
        .catch(err => {
          console.error("Ticket submission error:", err);
          this.notify("Failed to submit ticket: " + err.message, "error");
        })
        .finally(() => {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Submit Ticket";
          }
        });
    },

    loadMyTickets() {
      const listEl = document.getElementById("myTicketsList");
      if (!listEl) return;

      const visitorId = getVisitorId();
      if (typeof firebase === "undefined" || !firebase.database) {
        listEl.innerHTML = `<div class="ticket-empty">Firebase connecting...</div>`;
        return;
      }

      listEl.innerHTML = `<div class="ticket-loading">Loading your tickets...</div>`;

      firebase.database().ref(TICKETS_REF)
        .orderByChild("visitorId").equalTo(visitorId)
        .once("value", snapshot => {
          const val = snapshot.val();
          listEl.innerHTML = "";

          if (!val) {
            listEl.innerHTML = `
              <div class="ticket-empty-box">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 0.75rem; opacity: 0.6;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                <h4>No tickets found</h4>
                <p>You haven't submitted any support requests from this device yet.</p>
                <button type="button" class="btn btn-primary btn-sm" onclick="SupportSystem.switchView('new-ticket')" style="margin-top: 0.75rem;">Create New Ticket</button>
              </div>
            `;
            return;
          }

          const tickets = Object.entries(val)
            .map(([k, v]) => ({ key: k, ...v }))
            .sort((a, b) => b.createdAt - a.createdAt);

          tickets.forEach(ticket => {
            const card = this.createTicketCard(ticket);
            listEl.appendChild(card);
          });
        }, err => {
          listEl.innerHTML = `<div class="ticket-empty-box"><p>Unable to load tickets: ${err.message}</p></div>`;
        });
    },

    createTicketCard(ticket) {
      const card = document.createElement("div");
      card.className = "ticket-card";

      const dateStr = new Date(ticket.createdAt).toLocaleDateString(undefined, {
        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
      });

      const statusBadges = {
        open: `<span class="ticket-status-pill open">Open</span>`,
        replied: `<span class="ticket-status-pill replied">Replied</span>`,
        closed: `<span class="ticket-status-pill closed">Closed</span>`
      };

      const statusBadge = statusBadges[ticket.status] || statusBadges.open;
      const lastMsg = ticket.messages && ticket.messages.length > 0 ? ticket.messages[ticket.messages.length - 1] : null;
      const hasReply = ticket.messages && ticket.messages.some(m => m.sender === "admin");

      card.innerHTML = `
        <div class="ticket-card-top">
          <span class="ticket-id-tag">${ticket.ticketId}</span>
          ${statusBadge}
        </div>
        <h4 class="ticket-card-title">${ticket.subject}</h4>
        <p class="ticket-card-snippet">${(ticket.message || "").substring(0, 90)}${(ticket.message || "").length > 90 ? "..." : ""}</p>
        <div class="ticket-card-bottom">
          <span class="ticket-date"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-1px; margin-right:3px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>${dateStr}</span>
          ${hasReply ? `<span class="ticket-reply-flag">Admin Replied ✓</span>` : `<span style="font-size: 0.75rem; color: var(--text-muted);">${ticket.category || 'General'}</span>`}
        </div>
      `;

      card.addEventListener("click", () => {
        this.openTicketChat(ticket.key);
      });

      return card;
    },

    openTicketChat(firebaseKey) {
      this.activeTicketKey = firebaseKey;
      const chatPane = document.getElementById("ticketChatPane");
      const listPane = document.getElementById("myTicketsContainer");

      if (chatPane && listPane) {
        listPane.style.display = "none";
        chatPane.style.display = "block";
      }

      // Live listen to this ticket
      firebase.database().ref(`${TICKETS_REF}/${firebaseKey}`).on("value", snapshot => {
        const ticket = snapshot.val();
        if (!ticket) return;
        this.activeTicketData = ticket;
        this.renderChatThread(ticket);
      });
    },

    closeTicketChat() {
      if (this.activeTicketKey) {
        firebase.database().ref(`${TICKETS_REF}/${this.activeTicketKey}`).off();
      }
      this.activeTicketKey = null;
      this.activeTicketData = null;

      const chatPane = document.getElementById("ticketChatPane");
      const listPane = document.getElementById("myTicketsContainer");

      if (chatPane && listPane) {
        chatPane.style.display = "none";
        listPane.style.display = "block";
      }
    },

    renderChatThread(ticket) {
      const headerEl = document.getElementById("chatHeaderInfo");
      const messagesEl = document.getElementById("chatMessagesBox");
      const replyBox = document.getElementById("chatReplyBox");

      if (headerEl) {
        const statusMap = {
          open: "Open",
          replied: "Replied",
          closed: "Closed"
        };
        headerEl.innerHTML = `
          <div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span class="ticket-id-tag">${ticket.ticketId}</span>
              <span style="font-weight: 700; font-size: 0.85rem;">${statusMap[ticket.status] || ticket.status}</span>
            </div>
            <h3 style="font-size: 1.1rem; font-weight: 800; margin-top: 0.25rem;">${ticket.subject}</h3>
          </div>
        `;
      }

      if (messagesEl) {
        const msgs = ticket.messages || [];
        messagesEl.innerHTML = msgs.map(m => {
          const isAdmin = m.sender === "admin";
          const time = new Date(m.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return `
            <div class="chat-bubble-wrap ${isAdmin ? 'admin-wrap' : 'customer-wrap'}">
              <div class="chat-bubble ${isAdmin ? 'bubble-admin' : 'bubble-customer'}">
                <div class="chat-bubble-sender">${isAdmin ? '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-1px; margin-right:3px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> New Desgin Support' : (m.name || 'You')}</div>
                <div class="chat-bubble-text">${m.text}</div>
                <div class="chat-bubble-time">${time}</div>
              </div>
            </div>
          `;
        }).join("");
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }

      if (replyBox) {
        replyBox.style.display = ticket.status === "closed" ? "none" : "flex";
      }
    },

    sendFollowUpReply() {
      const input = document.getElementById("chatReplyInput");
      if (!input || !this.activeTicketKey) return;
      const text = input.value.trim();
      if (!text) return;

      const newMsg = {
        sender: "customer",
        name: (this.activeTicketData && this.activeTicketData.name) || "Customer",
        text: text,
        timestamp: Date.now()
      };

      const ref = firebase.database().ref(`${TICKETS_REF}/${this.activeTicketKey}`);
      ref.transaction(current => {
        if (!current) return current;
        if (!current.messages) current.messages = [];
        current.messages.push(newMsg);
        current.status = "open"; // Reopen when customer replies
        current.updatedAt = Date.now();
        return current;
      }).then(() => {
        input.value = "";
      }).catch(err => {
        this.notify("Failed to send reply: " + err.message, "error");
      });
    },

    trackTicketById() {
      const idInput = document.getElementById("trackTicketInput");
      const resultBox = document.getElementById("trackTicketResult");
      if (!idInput || !resultBox) return;

      const searchId = idInput.value.trim().toUpperCase();
      if (!searchId) return;

      resultBox.innerHTML = `<div class="ticket-loading">Searching for ${searchId}...</div>`;

      firebase.database().ref(TICKETS_REF)
        .orderByChild("ticketId").equalTo(searchId)
        .once("value", snapshot => {
          const val = snapshot.val();
          if (!val) {
            resultBox.innerHTML = `
              <div class="ticket-empty-box" style="margin-top: 1rem;">
                <p>No ticket found with ID: <strong>${searchId}</strong></p>
                <small style="color: var(--text-muted);">Please check the ID format (e.g. TKT-ABC1234).</small>
              </div>
            `;
            return;
          }

          const [key, ticket] = Object.entries(val)[0];
          resultBox.innerHTML = "";
          const card = this.createTicketCard({ key, ...ticket });
          resultBox.appendChild(card);
        }, err => {
          resultBox.innerHTML = `<div class="ticket-empty-box"><p>Search error: ${err.message}</p></div>`;
        });
    },

    notify(msg, type = "info") {
      if (typeof window.showToastNotification === "function") {
        window.showToastNotification(msg, type);
      } else {
        alert(msg);
      }
    }
  };

  window.SupportSystem = SupportSystem;

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => SupportSystem.init());
    } else {
      SupportSystem.init();
    }
  }
})();
