<!-- src/components/PluginPermissionDialog.svelte -->
<script lang="ts">
    import type { PluginStatus } from '$lib/stores/plugins';

    export let plugin: PluginStatus;
    export let onApprove: () => void;
    export let onDeny: () => void;

    const riskLevels: Record<string, string> = {
      filesystem: 'high',
      network: 'critical',
      commands: 'critical',
      ui: 'low',
    };

    function getRiskColor(capability: string) {
      const level = riskLevels[capability];
      return level === 'critical' ? 'text-red-500' : 
             level === 'high' ? 'text-orange-500' : 
             'text-yellow-500';
    }
  </script>
  
  <div class="permission-dialog glass-panel">
    <h2>Plugin Permission Request</h2>
    <p class="plugin-name">{plugin.name} v{plugin.version}</p>
    
    <div class="permissions-list">
      <h3>Requested Permissions:</h3>
      
      {#if plugin.capabilities.filesystem !== 'None'}
        <div class="permission-item">
          <span class={getRiskColor('filesystem')}>⚠</span>
          <span>Filesystem Access: {plugin.capabilities.filesystem}</span>
        </div>
      {/if}

      {#if plugin.capabilities.network !== 'None'}
        <div class="permission-item">
          <span class={getRiskColor('network')}>🔴</span>
          <span>Network Access</span>
          {#if plugin.capabilities.network.DomainAllowlist}
            <ul class="domain-list">
              {#each plugin.capabilities.network.DomainAllowlist as domain}
                <li>{domain}</li>
              {/each}
            </ul>
          {/if}
        </div>
      {/if}

      {#if plugin.capabilities.commands.allowlist.length > 0}
        <div class="permission-item">
          <span class={getRiskColor('commands')}>🔴</span>
          <span>Command Execution:</span>
          <code>{plugin.capabilities.commands.allowlist.join(', ')}</code>
        </div>
      {/if}
    </div>
    
    <div class="actions">
      <button class="deny" on:click={onDeny}>Deny</button>
      <button class="approve" on:click={onApprove}>Allow</button>
    </div>
  </div>