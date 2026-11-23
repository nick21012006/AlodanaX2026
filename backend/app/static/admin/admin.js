// ALODANAX Admin Panel JavaScript
(function () {
  'use strict';

  // CSRF Header Helper
  function getCsrfToken() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute('content') : '';
  }

  window.adminApi = {
    async request(url, options = {}) {
      const isFormData = options.body instanceof FormData;
      const baseHeaders = {
        'Accept': 'application/json',
        'X-CSRFToken': getCsrfToken()
      };
      if (!isFormData) {
        baseHeaders['Content-Type'] = 'application/json';
      }
      const headers = Object.assign(baseHeaders, options.headers || {});

      const response = await fetch(url, { ...options, headers });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const error = (data && data.error) ? data.error : { message: 'HTTP ' + response.status };
        throw error;
      }

      return data;
    }
  };

  // Toast System
  window.showToast = function (message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span>${message}</span>
      <button type="button" class="btn btn-sm btn-secondary" aria-label="Close notification" style="min-height:30px;min-width:30px;padding:0 6px;">&times;</button>
    `;

    toast.querySelector('button').addEventListener('click', () => toast.remove());
    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, 4500);
  };

  // Setup DOM Handlers
  document.addEventListener('DOMContentLoaded', () => {
    // 1. Password Visibility Toggle
    document.querySelectorAll('.pwd-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const input = document.getElementById(targetId);
        if (!input) return;
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        btn.textContent = isPassword ? 'HIDE' : 'SHOW';
        btn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
      });
    });

    // 2. Character Counters
    document.querySelectorAll('input[maxlength], textarea[maxlength]').forEach(field => {
      const max = field.getAttribute('maxlength');
      const counterId = field.getAttribute('data-counter');
      const counterEl = counterId ? document.getElementById(counterId) : null;

      function updateCounter() {
        if (counterEl) {
          counterEl.textContent = `${field.value.length} / ${max}`;
        }
      }

      field.addEventListener('input', updateCounter);
      updateCounter();
    });

    // 3. Unsaved Changes Warning
    const formsWithUnsavedCheck = document.querySelectorAll('form[data-unsaved-warning]');
    formsWithUnsavedCheck.forEach(form => {
      let isDirty = false;
      form.addEventListener('input', () => { isDirty = true; });
      form.addEventListener('submit', () => { isDirty = false; });

      window.addEventListener('beforeunload', (e) => {
        if (isDirty) {
          e.preventDefault();
          e.returnValue = '';
        }
      });
    });

    // 4. Live Problem Statement Card Preview
    const psForm = document.getElementById('ps-form');
    if (psForm) {
      const codeInput = document.getElementById('field-code');
      const titleInput = document.getElementById('field-title');
      const diffSelect = document.getElementById('field-difficulty');
      const descInput = document.getElementById('field-description');
      const outcomeInput = document.getElementById('field-outcome');

      const prevId = document.getElementById('prev-id');
      const prevDiff = document.getElementById('prev-diff');
      const prevTitle = document.getElementById('prev-title');
      const prevDesc = document.getElementById('prev-desc');
      const prevOutcome = document.getElementById('prev-outcome');

      function updatePreview() {
        if (prevId && codeInput) prevId.textContent = codeInput.value || 'PS-XX';
        if (prevTitle && titleInput) prevTitle.textContent = titleInput.value || 'Problem Statement Title';
        if (prevDesc && descInput) prevDesc.textContent = descInput.value || 'Problem description preview will appear here.';
        if (prevOutcome && outcomeInput) prevOutcome.textContent = outcomeInput.value || 'Expected outcome preview will appear here.';

        if (prevDiff && diffSelect) {
          const val = diffSelect.value || 'MEDIUM';
          prevDiff.textContent = val;
          prevDiff.className = `ps-diff-badge ${(val === 'EXTREME' || val === 'HARD') ? 'badge-hard' : 'badge-medium'}`;
        }
      }

      [codeInput, titleInput, diffSelect, descInput, outcomeInput].forEach(el => {
        if (el) el.addEventListener('input', updatePreview);
      });
      updatePreview();

      // Auto-suggest button
      const suggestBtn = document.getElementById('btn-suggest-code');
      if (suggestBtn) {
        suggestBtn.addEventListener('click', async () => {
          try {
            const data = await window.adminApi.request('/api/admin/statements/suggest-code');
            if (data && data.suggested_code && codeInput) {
              codeInput.value = data.suggested_code;
              updatePreview();
              window.showToast(`Suggested code: ${data.suggested_code}`);
            }
          } catch (err) {
            window.showToast('Could not auto-suggest code: ' + (err.message || err), 'error');
          }
        });
      }
    }

    // 5. Domain Form Submission (AJAX)
    const domainForm = document.getElementById('domain-form');
    if (domainForm) {
      document.querySelectorAll('.domain-submit-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          // Clear error messages
          document.querySelectorAll('.form-error').forEach(el => {
            el.textContent = '';
            el.style.display = 'none';
          });

          const mode = domainForm.getAttribute('data-mode');
          const domainId = domainForm.getAttribute('data-id');
          const isPublished = btn.getAttribute('data-publish') === 'true';

          const name = document.getElementById('domain-name').value;
          const shortDescription = document.getElementById('domain-desc').value;

          const payload = {
            name,
            short_description: shortDescription,
            is_published: isPublished
          };

          try {
            btn.disabled = true;
            btn.textContent = 'SAVING...';

            let res;
            if (mode === 'create') {
              res = await window.adminApi.request('/api/admin/domains', {
                method: 'POST',
                body: JSON.stringify(payload)
              });
              window.showToast('Domain created successfully!');
              setTimeout(() => {
                window.location.href = `/admin/domains/${res.domain.id}/edit`;
              }, 400);
            } else {
              res = await window.adminApi.request(`/api/admin/domains/${domainId}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
              });
              window.showToast('Domain updated successfully!');
              setTimeout(() => {
                window.location.reload();
              }, 400);
            }
          } catch (err) {
            btn.disabled = false;
            btn.textContent = isPublished ? 'SAVE & PUBLISH' : 'SAVE AS DRAFT';

            if (err.fields) {
              for (const [field, msgs] of Object.entries(err.fields)) {
                const errEl = document.getElementById(`error-${field}`);
                if (errEl) {
                  errEl.textContent = Array.isArray(msgs) ? msgs.join(' ') : msgs;
                  errEl.style.display = 'block';
                }
              }
            }
            window.showToast(err.message || 'Error saving domain.', 'error');
          }
        });
      });
    }

    // 6. Statement Form Submission (AJAX)
    if (psForm) {
      document.querySelectorAll('.ps-submit-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          document.querySelectorAll('.form-error').forEach(el => {
            el.textContent = '';
            el.style.display = 'none';
          });

          const mode = psForm.getAttribute('data-mode');
          const psId = psForm.getAttribute('data-id');
          const domainId = psForm.getAttribute('data-domain-id');
          const isPublished = btn.getAttribute('data-publish') === 'true';

          const code = document.getElementById('field-code').value;
          const title = document.getElementById('field-title').value;
          const difficulty = document.getElementById('field-difficulty').value;
          const description = document.getElementById('field-description').value;
          const expectedOutcome = document.getElementById('field-outcome').value;

          const payload = {
            code,
            title,
            difficulty,
            description,
            expected_outcome: expectedOutcome,
            is_published: isPublished
          };

          try {
            btn.disabled = true;
            btn.textContent = 'SAVING...';

            if (mode === 'create') {
              await window.adminApi.request(`/api/admin/domains/${domainId}/statements`, {
                method: 'POST',
                body: JSON.stringify(payload)
              });
              window.showToast('Problem statement created successfully!');
              setTimeout(() => {
                window.location.href = `/admin/domains/${domainId}/edit`;
              }, 400);
            } else {
              await window.adminApi.request(`/api/admin/statements/${psId}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
              });
              window.showToast('Problem statement updated successfully!');
              setTimeout(() => {
                window.location.href = `/admin/domains/${domainId}/edit`;
              }, 400);
            }
          } catch (err) {
            btn.disabled = false;
            btn.textContent = isPublished ? 'SAVE & PUBLISH' : 'SAVE AS DRAFT';

            if (err.fields) {
              for (const [field, msgs] of Object.entries(err.fields)) {
                const errEl = document.getElementById(`error-${field}`);
                if (errEl) {
                  errEl.textContent = Array.isArray(msgs) ? msgs.join(' ') : msgs;
                  errEl.style.display = 'block';
                }
              }
            }
            window.showToast(err.message || 'Error saving problem statement.', 'error');
          }
        });
      });
    }

    // 7. Domains Table Reordering & Actions
    const domainsTbody = document.getElementById('domains-tbody');
    if (domainsTbody) {
      // Reorder buttons
      domainsTbody.addEventListener('click', async (e) => {
        const moveBtn = e.target.closest('.domain-move-btn');
        if (!moveBtn || moveBtn.disabled) return;

        const row = moveBtn.closest('tr');
        const dir = moveBtn.getAttribute('data-dir');

        if (dir === 'up' && row.previousElementSibling) {
          domainsTbody.insertBefore(row, row.previousElementSibling);
        } else if (dir === 'down' && row.nextElementSibling) {
          domainsTbody.insertBefore(row.nextElementSibling, row);
        }

        // Collect new order
        const order = Array.from(domainsTbody.querySelectorAll('tr[data-domain-id]'))
          .map(r => parseInt(r.getAttribute('data-domain-id'), 10));

        try {
          await window.adminApi.request('/api/admin/domains/reorder', {
            method: 'POST',
            body: JSON.stringify({ order })
          });
          window.showToast('Domain order updated!');
          setTimeout(() => window.location.reload(), 300);
        } catch (err) {
          window.showToast('Failed to update domain order: ' + err.message, 'error');
        }
      });

      // Toggle Publish
      domainsTbody.addEventListener('click', async (e) => {
        const toggleBtn = e.target.closest('.domain-toggle-publish-btn');
        if (!toggleBtn) return;

        const domainId = toggleBtn.getAttribute('data-domain-id');
        const isPublished = toggleBtn.getAttribute('data-is-published') === 'true';
        const action = isPublished ? 'unpublish' : 'publish';

        try {
          const res = await window.adminApi.request(`/api/admin/domains/${domainId}/${action}`, {
            method: 'POST'
          });
          const newState = res.domain.is_published;
          toggleBtn.setAttribute('data-is-published', newState ? 'true' : 'false');
          toggleBtn.textContent = newState ? 'PUBLISHED' : 'DRAFT';
          toggleBtn.className = `btn btn-sm domain-toggle-publish-btn ${newState ? 'chip-published' : 'chip-draft'}`;
          window.showToast(`Domain ${newState ? 'published' : 'unpublished'}!`);
        } catch (err) {
          window.showToast('Failed to change publish state: ' + err.message, 'error');
        }
      });

      // Delete Domain
      domainsTbody.addEventListener('click', async (e) => {
        const delBtn = e.target.closest('.domain-delete-btn');
        if (!delBtn) return;

        const domainId = delBtn.getAttribute('data-domain-id');
        const name = delBtn.getAttribute('data-name');
        const stmtCount = delBtn.getAttribute('data-statements-count');

        const confirmed = window.confirm(
          `Are you sure you want to delete domain "${name}"?\n\nWARNING: This will permanently delete ${stmtCount} associated problem statements!`
        );
        if (!confirmed) return;

        try {
          await window.adminApi.request(`/api/admin/domains/${domainId}`, {
            method: 'DELETE'
          });
          window.showToast(`Domain "${name}" deleted.`);
          delBtn.closest('tr').remove();
        } catch (err) {
          window.showToast('Failed to delete domain: ' + err.message, 'error');
        }
      });
    }

    // 8. Statements Table Reordering & Actions (inside domain_form)
    const statementsTbody = document.getElementById('statements-tbody');
    if (statementsTbody) {
      const domainId = statementsTbody.getAttribute('data-domain-id');

      // Reorder statements
      statementsTbody.addEventListener('click', async (e) => {
        const moveBtn = e.target.closest('.ps-move-btn');
        if (!moveBtn || moveBtn.disabled) return;

        const row = moveBtn.closest('tr');
        const dir = moveBtn.getAttribute('data-dir');

        if (dir === 'up' && row.previousElementSibling) {
          statementsTbody.insertBefore(row, row.previousElementSibling);
        } else if (dir === 'down' && row.nextElementSibling) {
          statementsTbody.insertBefore(row.nextElementSibling, row);
        }

        const order = Array.from(statementsTbody.querySelectorAll('tr[data-ps-id]'))
          .map(r => parseInt(r.getAttribute('data-ps-id'), 10));

        try {
          await window.adminApi.request(`/api/admin/domains/${domainId}/statements/reorder`, {
            method: 'POST',
            body: JSON.stringify({ order })
          });
          window.showToast('Statement order updated!');
          setTimeout(() => window.location.reload(), 300);
        } catch (err) {
          window.showToast('Failed to update statement order: ' + err.message, 'error');
        }
      });

      // Toggle Publish statement
      statementsTbody.addEventListener('click', async (e) => {
        const toggleBtn = e.target.closest('.ps-toggle-publish-btn');
        if (!toggleBtn) return;

        const psId = toggleBtn.getAttribute('data-ps-id');
        const isPublished = toggleBtn.getAttribute('data-is-published') === 'true';
        const action = isPublished ? 'unpublish' : 'publish';

        try {
          const res = await window.adminApi.request(`/api/admin/statements/${psId}/${action}`, {
            method: 'POST'
          });
          const newState = res.problem_statement.is_published;
          toggleBtn.setAttribute('data-is-published', newState ? 'true' : 'false');
          toggleBtn.textContent = newState ? 'PUBLISHED' : 'DRAFT';
          toggleBtn.className = `btn btn-sm ps-toggle-publish-btn ${newState ? 'chip-published' : 'chip-draft'}`;
          window.showToast(`Problem statement ${newState ? 'published' : 'unpublished'}!`);
        } catch (err) {
          window.showToast('Failed to change publish state: ' + err.message, 'error');
        }
      });

      // Delete Statement
      statementsTbody.addEventListener('click', async (e) => {
        const delBtn = e.target.closest('.ps-delete-btn');
        if (!delBtn) return;

        const psId = delBtn.getAttribute('data-ps-id');
        const code = delBtn.getAttribute('data-code');

        const confirmed = window.confirm(`Are you sure you want to permanently delete statement ${code}?`);
        if (!confirmed) return;

        try {
          await window.adminApi.request(`/api/admin/statements/${psId}`, {
            method: 'DELETE'
          });
          window.showToast(`Statement ${code} deleted.`);
          delBtn.closest('tr').remove();
        } catch (err) {
          window.showToast('Failed to delete statement: ' + err.message, 'error');
        }
      });
    }

    // =========================================================================
    // 8. STATIC EXPORT & "PUBLISH TO WEBSITE" HANDLER
    // =========================================================================
    document.querySelectorAll('.btn-publish-trigger').forEach(btn => {
      btn.addEventListener('click', async () => {
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'PUBLISHING...';
        try {
          const res = await window.adminApi.request('/api/admin/export', {
            method: 'POST'
          });
          window.showToast(res.message || 'Done. Now upload data/hackathon-domains.json to your website.');
          setTimeout(() => {
            window.location.reload();
          }, 1200);
        } catch (err) {
          window.showToast(err.message || 'Export failed.', 'error');
          btn.disabled = false;
          btn.textContent = originalText;
        }
      });
    });
  });
})();
