<!-- src/components/PluginPermissionDialog.svelte -->
<script lang="ts">
  import type { PluginStatus } from '$lib/stores/plugins';
  import { icons } from '../lib/icons/index';

  export let plugin: PluginStatus;
  export let onApprove: () => void;
  export let onDeny: () => void;

  const riskLevels: Record<string, string> = {
    filesystem: 'high',
    network: 'critical',
    commands: 'critical',
    ui: 'low',
  };

  function getRiskBadge(capability: string): { color: string; label: string } {
    const level = riskLevels[capability] || 'low';
    if (level === 'critical') return { color: '#ff4444', label: 'CRITICAL' };
    if (level === 'high') return { color: '#ff9800', label: 'HIGH' };
    return { color: '#ffc107', label: 'MEDIUM' };
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') onDeny();
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div
  class="dialog-backdrop"
  role="dialog"
  aria-modal="true"
  aria-labelledby="permission-dialog-title"
>
  <div class="permission-dialog">
    <div class="dialog-header">
      <div class="shield-icon">{@html icons.shield}</div>
      <h2 id="permission-dialog-title">Permission Request</h2>
    </div>

    <p class="plugin-name">{plugin.name} <span class="plugin-version">v{plugin.version}</span></p>
    <p class="plugin-description">This plugin requests the following permissions:</p>

    <div class="permissions-list">
      {#if plugin.capabilities.filesystem && plugin.capabilities.filesystem !== 'None'}
        {@const badge = getRiskBadge('filesystem')}
        <div class="permission-item">
          <span class="risk-badge" style="background: {badge.color}">{badge.label}</span>
          <div class="permission-info">
            <strong>Filesystem Access</strong>
            <span class="permission-detail">{plugin.capabilities.filesystem}</span>
          </div>
        </div>
      {/if}

      {#if plugin.capabilities.network && plugin.capabilities.network !== 'None'}
        {@const badge = getRiskBadge('network')}
        <div class="permission-item">
          <span class="risk-badge" style="background: {badge.color}">{badge.label}</span>
          <div class="permission-info">
            <strong>Network Access</strong>
            {#if plugin.capabilities.network?.DomainAllowlist}
              <span class="permission-detail">
                Domains: {plugin.capabilities.network.DomainAllowlist.join(', ')}
              </span>
            {:else}
              <span class="permission-detail">Unrestricted</span>
            {/if}
          </div>
        </div>
      {/if}

      {#if plugin.capabilities.commands?.allowlist?.length > 0}
        {@const badge = getRiskBadge('commands')}
        <div class="permission-item">
          <span class="risk-badge" style="background: {badge.color}">{badge.label}</span>
          <div class="permission-info">
            <strong>Command Execution</strong>
            <code class="permission-detail"
              >{plugin.capabilities.commands.allowlist.join(', ')}</code
            >
          </div>
        </div>
      {/if}

      {#if plugin.capabilities.ui?.status_bar || plugin.capabilities.ui?.sidebar || plugin.capabilities.ui?.notifications}
        {@const badge = getRiskBadge('ui')}
        <div class="permission-item">
          <span class="risk-badge" style="background: {badge.color}">{badge.label}</span>
          <div class="permission-info">
            <strong>UI Access</strong>
            <span class="permission-detail">
              {[
                plugin.capabilities.ui.status_bar && 'Status Bar',
                plugin.capabilities.ui.sidebar && 'Sidebar',
                plugin.capabilities.ui.notifications && 'Notifications',
              ]
                .filter(Boolean)
                .join(', ')}
            </span>
          </div>
        </div>
      {/if}
    </div>

    <div class="actions">
      <button class="btn btn-deny" on:click={onDeny}>Deny</button>
      <button class="btn btn-approve" on:click={onApprove}>Allow</button>
    </div>
  </div>
</div>

<style>
  .dialog-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 20000;
    animation: fadeIn 150ms ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .permission-dialog {
    width: 440px;
    background: var(--chrome-bg, rgba(30, 30, 30, 0.97));
    color: var(--text-primary, #e4e4e4);
    border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(20px);
    padding: 24px;
    animation: slideUp 200ms ease-out;
  }

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .dialog-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
  }

  .shield-icon {
    display: flex;
    align-items: center;
    color: var(--color-primary, #00d9ff);
  }

  .shield-icon :global(svg) {
    width: 24px;
    height: 24px;
  }

  .dialog-header h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary, #e4e4e4);
  }

  .plugin-name {
    margin: 0 0 4px 0;
    font-size: 15px;
    font-weight: 600;
    color: var(--color-primary, #00d9ff);
  }

  .plugin-version {
    font-weight: 400;
    color: var(--text-secondary, rgba(228, 228, 228, 0.5));
    font-size: 13px;
  }

  .plugin-description {
    margin: 0 0 16px 0;
    font-size: 13px;
    color: var(--text-secondary, rgba(228, 228, 228, 0.6));
  }

  .permissions-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 24px;
  }

  .permission-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 12px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
  }

  .risk-badge {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.5px;
    padding: 2px 6px;
    border-radius: 4px;
    color: white;
    white-space: nowrap;
    margin-top: 2px;
  }

  .permission-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .permission-info strong {
    font-size: 13px;
    color: var(--text-primary, #e4e4e4);
  }

  .permission-detail {
    font-size: 12px;
    color: var(--text-secondary, rgba(228, 228, 228, 0.5));
  }

  code.permission-detail {
    font-family: monospace;
    background: rgba(255, 255, 255, 0.06);
    padding: 2px 6px;
    border-radius: 4px;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }

  .btn {
    padding: 8px 20px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 150ms ease;
  }

  .btn-deny {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.15);
    color: var(--text-primary, #e4e4e4);
  }

  .btn-deny:hover {
    background: rgba(255, 68, 68, 0.15);
    border-color: #ff4444;
    color: #ff4444;
  }

  .btn-approve {
    background: var(--color-primary, #00d9ff);
    color: #000;
  }

  .btn-approve:hover {
    filter: brightness(1.1);
  }

  .btn:active {
    transform: scale(0.97);
  }
</style>
