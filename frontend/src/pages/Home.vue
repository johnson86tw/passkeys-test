<script setup lang="ts">
import { startRegistration } from '@simplewebauthn/browser'
import { ref } from 'vue'

const username = ref('')

const API_URL = 'http://localhost:3000'

async function requestRegistrationOptions(username: string) {
	const response = await fetch(API_URL + '/start-registering', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			username,
		}),
	}).then(res => res.json())

	return response.data.options
}

async function onClickRegister() {
	try {
		const options = await requestRegistrationOptions(username.value)
		console.log('options', options)

		const registration = await startRegistration(options)

		const response = await fetch(API_URL + '/register', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				username: username.value,
				registration,
			}),
		}).then(res => res.json())

		const { verified } = response.data
		console.log('register verified', verified)
	} catch (e) {
		console.error(e)
	}
}
</script>

<template>
	<div class="p-5 flex flex-col gap-5">
		<div class="flex flex-col gap-2">
			<div class="title">Registration</div>

			<div class="flex gap-2 items-center">
				<label for="username">Username</label>
				<input v-model="username" type="text" class="input" @keypress.enter="onClickRegister" />
			</div>
			<div>
				<button class="btn" @click="onClickRegister">Register</button>
			</div>
		</div>

		<div class="flex flex-col gap-2">
			<div class="title">Login</div>

			<div class="flex gap-2 items-center">
				<label for="username">Username</label>
				<input type="text" class="input" />
			</div>
			<div>
				<button class="btn">Login</button>
			</div>
		</div>
	</div>
</template>

<style lang="css">
.title {
	@apply text-xl;
}

.btn {
	@apply border py-1 px-3 text-base bg-teal-600 text-white rounded cursor-pointer hover:bg-teal-700 disabled:cursor-default disabled:bg-gray-600 disabled:opacity-50;
}

.input {
	@apply w-[150px] h-[27px] shadow appearance-none border rounded py-3 px-3 text-gray-700 leading-tight focus:outline-none;
}
</style>
