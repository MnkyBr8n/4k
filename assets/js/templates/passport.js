// Passport/ID Template JavaScript

function renderPassportTemplate(data) {
    return `
        <div class="id-card">
            <div class="card-header">
                <div class="university-name">🎓 Artisan University</div>
                <div class="card-type">${data.role === 'student' ? 'Student' : data.role === 'professor' ? 'Faculty' : 'Staff'} Identification Card</div>
            </div>

            <div class="card-main">
                <!-- Photo Section (Left) -->
                <div class="photo-section">
                    <img src="${data.photo || 'assets/placeholder.jpg'}" alt="${data.name}" class="id-photo">
                    <div class="role-badge">${data.role ? data.role.charAt(0).toUpperCase() + data.role.slice(1) : 'Student'}</div>
                </div>

                <!-- Info Section (Right) -->
                <div class="info-section">
                    <div class="info-field">
                        <div class="info-label">Full Name</div>
                        <div class="info-value">${data.name}</div>
                    </div>

                    <div class="info-divider"></div>

                    <div class="info-field">
                        <div class="info-label">Age</div>
                        <div class="info-value">${data.age}</div>
                    </div>

                    <div class="info-divider"></div>

                    <div class="info-field">
                        <div class="info-label">${data.role === 'professor' ? 'Department' : 'Major'}</div>
                        <div class="info-value">${data.major || 'Not specified'}</div>
                    </div>

                    <div class="info-divider"></div>

                    <div class="info-field">
                        <div class="info-label">${data.role === 'professor' ? 'Title' : 'Year'}</div>
                        <div class="info-value">${data.year || 'Not specified'}</div>
                    </div>

                    <div class="info-divider"></div>

                    <div class="info-field">
                        <div class="info-label">${data.role === 'professor' ? 'Employee' : 'Student'} ID</div>
                        <div class="info-value">${data.id_number || 'N/A'}</div>
                    </div>
                </div>
            </div>

            <!-- Bio Section (Bottom) -->
            <div class="bio-section">
                <div class="bio-title">📝 About Me</div>
                <div class="bio-text">
                    ${data.bio || 'No bio provided.'}
                </div>
            </div>

            <!-- Footer with Button -->
            <div class="card-footer">
                <button class="university-button" onclick="window.location.href='${data.link || '#'}'">
                    Visit University Page →
                </button>
            </div>
        </div>
    `;
}