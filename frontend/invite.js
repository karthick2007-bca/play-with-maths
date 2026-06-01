function sendInvite() {
    const username = document.getElementById('friend-username').value.trim();
    const currentUser = localStorage.getItem('currentUser') || 'Guest';
    
    if (!username) {
        showMessage('Please enter a username', 'error');
        return;
    }
    
    if (username === currentUser) {
        showMessage('You cannot invite yourself!', 'error');
        return;
    }
    
    const invites = JSON.parse(localStorage.getItem('invites') || '[]');
    
    const alreadyInvited = invites.find(inv => inv.to === username && inv.from === currentUser);
    if (alreadyInvited) {
        showMessage('You already sent an invite to this user', 'error');
        return;
    }
    
    invites.push({
        from: currentUser,
        to: username,
        timestamp: new Date().toISOString(),
        status: 'pending'
    });
    
    localStorage.setItem('invites', JSON.stringify(invites));
    
    showMessage(`Invite sent to ${username}!`, 'success');
    document.getElementById('friend-username').value = '';
    loadRequests();
}

function acceptInvite(from) {
    const invites = JSON.parse(localStorage.getItem('invites') || '[]');
    const invite = invites.find(inv => inv.from === from && inv.to === localStorage.getItem('currentUser'));
    
    if (invite) {
        invite.status = 'accepted';
        localStorage.setItem('invites', JSON.stringify(invites));
        
        const currentScore = parseInt(localStorage.getItem('easyScore') || 0);
        localStorage.setItem('easyScore', currentScore + 50);
        
        showMessage('Invite accepted! You earned 50 bonus points!', 'success');
        loadRequests();
    }
}

function rejectInvite(from) {
    const invites = JSON.parse(localStorage.getItem('invites') || '[]');
    const updatedInvites = invites.filter(inv => !(inv.from === from && inv.to === localStorage.getItem('currentUser')));
    
    localStorage.setItem('invites', JSON.stringify(updatedInvites));
    showMessage('Invite rejected', 'error');
    loadRequests();
}

function loadRequests() {
    const currentUser = localStorage.getItem('currentUser') || 'Guest';
    const invites = JSON.parse(localStorage.getItem('invites') || '[]');
    
    const receivedInvites = invites.filter(inv => inv.to === currentUser && inv.status === 'pending');
    const receivedEl = document.getElementById('received-list');
    
    if (receivedInvites.length === 0) {
        receivedEl.innerHTML = '<p style="color: #666; text-align: center;">No received requests</p>';
    } else {
        receivedEl.innerHTML = '';
        receivedInvites.forEach(invite => {
            const item = document.createElement('div');
            item.className = 'request-item';
            item.innerHTML = `
                <div>
                    <div class="request-user">👤 ${invite.from}</div>
                    <div class="request-status">Received: ${new Date(invite.timestamp).toLocaleDateString()}</div>
                </div>
                <div>
                    <button class="action-btn accept-btn" onclick="acceptInvite('${invite.from}')">✓ Accept</button>
                    <button class="action-btn reject-btn" onclick="rejectInvite('${invite.from}')">✗ Reject</button>
                </div>
            `;
            receivedEl.appendChild(item);
        });
    }
    
    const sentInvites = invites.filter(inv => inv.from === currentUser);
    const sentEl = document.getElementById('sent-list');
    
    if (sentInvites.length === 0) {
        sentEl.innerHTML = '<p style="color: #666; text-align: center;">No sent invites</p>';
    } else {
        sentEl.innerHTML = '';
        sentInvites.forEach(invite => {
            const item = document.createElement('div');
            item.className = 'request-item';
            const statusColor = invite.status === 'accepted' ? '#28a745' : '#ffc107';
            const statusText = invite.status === 'accepted' ? '✓ Accepted' : '⏳ Pending';
            item.innerHTML = `
                <div>
                    <div class="request-user">👤 ${invite.to}</div>
                    <div class="request-status">Sent: ${new Date(invite.timestamp).toLocaleDateString()}</div>
                </div>
                <div style="color: ${statusColor}; font-weight: bold;">${statusText}</div>
            `;
            sentEl.appendChild(item);
        });
    }
}

function showMessage(message, type) {
    const msgEl = document.getElementById('invite-message');
    msgEl.innerHTML = `<div class="${type}">${message}</div>`;
    setTimeout(() => msgEl.innerHTML = '', 3000);
}

loadRequests();
setInterval(loadRequests, 3000);
