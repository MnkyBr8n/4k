// assets/js/templates/passport.js
import { registerTemplate } from '../oc-modal-core.js';

function roleKindFrom(c) {
  // Try to infer a simple role flag for the badge
  const r = (c.role || '').toLowerCase();
  if (r.includes('professor') || r.includes('faculty')) return 'professor';
  if (r.includes('staff')) return 'staff';
  return 'student';
}

registerTemplate('passport', (c) => {
  // Map your character data to the UI the template expects
  const data = {
    name: c.name || c.id || 'Unknown',
    age: c.age ?? '',
    role: roleKindFrom(c),                         // 'student' | 'professor' | 'staff'
    photo: c.portrait || (c.images?.[0]?.src) || 'assets/placeholder.jpg',
    major: c.faculty || c.department || '',        // your characters often have `faculty`
    year: c.semester || c.year || '',              // `semester` maps well
    id_number: c.studentId || c.employeeId || '',  // `studentId` in your data
    bio: c.aboutQuick || c.aboutLong || c.motto || '',
    link: c.link || '#'
  };

  const html = `
    <div class="id-card">
      <div class="card-header">
        <div class="university-name">🎓 ${c.university || 'Artisan University'}</div>
        <div class="card-type">
          ${data.role === 'professor' ? 'Faculty' : data.role === 'staff' ? 'Staff' : 'Student'} Identification Card
        </div>
      </div>

      <div class="card-main">
        <div class="photo-section">
          <img src="${data.photo}" alt="${data.name}" class="id-photo">
          <div class="role-badge">${data.role.charAt(0).toUpperCase()}${data.role.slice(1)}</div>
        </div>

        <div class="info-section">
          <div class="info-field">
            <div class="info-label">Full Name</div>
            <div class="info-value">${data.name}</div>
          </div>

          <div class="info-divider"></div>

          <div class="info-field">
            <div class="info-label">Age</div>
            <div class="info-value">${data.age || '—'}</div>
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

      <div class="bio-section">
        <div class="bio-title">📝 About Me</div>
        <div class="bio-text">${data.bio}</div>
      </div>

      <div class="card-footer">
        ${data.link ? `<a class="university-button" href="${data.link}" target="_blank" rel="noopener">Visit University Page →</a>` : ''}
      </div>
    </div>
  `;

  return { html, wrapperClass: 'passport-wrap' };
});