import { createRouter, createWebHashHistory } from 'vue-router';
import NetworkInterfaceSelector from './views/NetworkInterfaceSelector.vue';
import Capture from './views/Capture.vue';

const routes = [
    { path: '/', component: NetworkInterfaceSelector },
    { path: '/capture/:deviceName', component: Capture }
];

const router = createRouter({
    history: createWebHashHistory(),
    routes
});

export default router;
