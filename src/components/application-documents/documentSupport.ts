import Swal from 'sweetalert2'
import { generateApplicationAcceptanceInvoice } from '../../data/applicationDocuments'

export { generateApplicationAcceptanceInvoice as generateAcceptanceInvoice }
export const notifyError = (message: string) => void Swal.fire({ icon: 'error', title: 'Unable to continue', text: message })
export const notifySuccess = (message: string) => void Swal.fire({ icon: 'success', title: 'Successful', text: message, timer: 2200, showConfirmButton: false })
export const showAcceptancePaymentConfirmation = () => Swal.fire({ icon: 'question', title: 'Proceed to Acceptance Payment?', text: 'Do you want to continue with your acceptance payment now?', showCancelButton: true, confirmButtonText: 'Yes, Proceed', confirmButtonColor: '#0A2B4F' })
export const showAcceptancePaymentLoading = () => void Swal.fire({ title: 'Generating Acceptance Invoice', text: 'Please wait while we prepare your payment invoice.', allowOutsideClick: false, showConfirmButton: false, didOpen: () => Swal.showLoading() })
export const closeAcceptancePaymentLoading = () => Swal.close()
