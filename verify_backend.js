
const API_URL = 'http://localhost:8000';

async function verify() {
    console.log('--- Verifying Backend ---');

    try {
        // 1. Get Menu
        console.log('\n1. Fetching Menu...');
        const menuRes = await fetch(`${API_URL}/api/menu`);
        if (!menuRes.ok) throw new Error('Menu fetch failed');
        const menu = await menuRes.json();
        console.log('✅ Menu fetched. Items:', menu.length);

        // 2. Place Order
        console.log('\n2. Placing Order...');
        const orderPayload = {
            tableId: "T1",
            guestName: "Verifier",
            items: [
                { name: "Test Item", quantity: 1, price: 100 }
            ],
            totalAmount: 100
        };

        const orderRes = await fetch(`${API_URL}/api/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderPayload)
        });

        if (!orderRes.ok) {
            const err = await orderRes.text();
            throw new Error('Order placement failed: ' + err);
        }
        const order = await orderRes.json();
        console.log('✅ Order placed. ID:', order.id);

        // 3. Update Status
        console.log('\n3. Updating Status...');
        const statusRes = await fetch(`${API_URL}/api/orders/${order.id}/status?status=cooking`, {
            method: 'PATCH'
        });
        if (!statusRes.ok) {
            const err = await statusRes.text();
            throw new Error('Status update failed: ' + err);
        }
        const updatedOrder = await statusRes.json();
        console.log('✅ Status updated to:', updatedOrder.status);

        console.log('\n--- VERIFICATION SUCCESS ---');

    } catch (err) {
        console.error('\n❌ VERIFICATION FAILED:', err);
        process.exit(1);
    }
}

verify();
